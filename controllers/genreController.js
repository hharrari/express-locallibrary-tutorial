const Genre = require("../models/genre");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
// Display list of all Genres.
exports.genre_list = async (req, res, next) => {
  try {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    res.render("genre_list", {
      title: "Genre List",
      genre_list: allGenres,
    });
  } catch (err) {
    return next(err);
  }
};


// Display detail page for a specific Genre.
exports.genre_detail = async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre,
    genre_books: booksInGenre,
  });
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid.
    // Check if Genre with same name already exists.
    const genreExists = await Genre.findOne({ name: req.body.name })
      .collation({ locale: "en", strength: 2 })
      .exec();
    if (genreExists) {
      // Genre exists, redirect to its detail page.
      res.redirect(genreExists.url);
      return;
    }

    // New genre. Save and redirect to its detail page.
    await genre.save();
    res.redirect(genre.url);
  },
];

// Display Genre delete form on GET
exports.genre_delete_get = async (req, res, next) => {
  try {
    const [genre, allBooks] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec(),
    ]);

    if (!genre) {
      return res.redirect('/catalog/genres');
    }

    res.render('genre_delete', {
      title: 'Delete Genre',
      genre,
      genre_books: allBooks,
    });
  } catch (err) {
    return next(err);
  }
};

// Handle Genre delete on POST
exports.genre_delete_post = async (req, res, next) => {
  try {
    const [genre, allBooks] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec(),
    ]);

    if (allBooks.length > 0) {
      // Cannot delete if books exist in this genre
      res.render('genre_delete', {
        title: 'Delete Genre',
        genre,
        genre_books: allBooks,
      });
      return;
    }

    await Genre.findByIdAndDelete(req.body.genreid);
    res.redirect('/catalog/genres');
  } catch (err) {
    return next(err);
  }
};

// Display Genre update form on GET.
exports.genre_update_get = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id).exec();

    if (genre == null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    res.render("genre_form", {
      title: "Update Genre",
      genre: genre,
    });
  } catch (err) {
    return next(err);
  }
};




// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id // ✅ Required to update instead of creating a new one
    });

    if (!errors.isEmpty()) {
      return res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
    }

    try {
      await Genre.findByIdAndUpdate(req.params.id, genre);
      res.redirect(genre.url);
    } catch (err) {
      return next(err);
    }
  }
];
