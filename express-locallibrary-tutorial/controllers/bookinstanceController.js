const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async (req, res, next) => {
  try {
    const bookInstance = await BookInstance.findById(req.params.id)
      .populate("book")
      .exec();

    if (bookInstance === null) {
      const err = new Error("Book copy not found");
      err.status = 404;
      return next(err);
    }

    res.render("bookinstance_detail", {
      title: "Book Instance Detail",
      bookinstance: bookInstance,
    });
  } catch (err) {
    return next(err);
  }
};


// Display BookInstance create form on GET.
exports.bookinstance_create_get = async (req, res, next) => {
  const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    }

    // Data from form is valid
    await bookInstance.save();
    res.redirect(bookInstance.url);
  },
];

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = async (req, res, next) => {
  try {
    const bookInstance = await BookInstance.findById(req.params.id).populate('book').exec();
    if (!bookInstance) {
      // No such BookInstance, redirect to list
      return res.redirect('/catalog/bookinstances');
    }

    res.render('bookinstance_delete', {
      title: 'Delete Book Instance',
      bookinstance: bookInstance,
    });
  } catch (err) {
    return next(err);
  }
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = async (req, res, next) => {
  try {
    await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
    res.redirect('/catalog/bookinstances');
  } catch (err) {
    return next(err);
  }
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async (req, res, next) => {
  try {
    const [bookInstance, allBooks] = await Promise.all([
      BookInstance.findById(req.params.id).populate("book").exec(),
      Book.find({}, "title").sort({ title: 1 }).exec(),
    ]);

    if (!bookInstance) {
      const err = new Error("BookInstance not found");
      err.status = 404;
      return next(err);
    }

    res.render("bookinstance_form", {
      title: "Update BookInstance",
      book_list: allBooks,
      bookinstance: bookInstance,
    });
  } catch (err) {
    return next(err);
  }
};


// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      _id: req.params.id,   // ✅ REQUIRED to update existing record
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      return res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: allBooks,
        bookinstance: bookInstance,
        errors: errors.array(),
      });
    }

    try {
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance);
      res.redirect(bookInstance.url);
    } catch (err) {
      return next(err);
    }
  },
];
