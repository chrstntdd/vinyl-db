module.exports = function(app, passport) {
	const express = require('express');
	require('dotenv').config();
	const map = require('lodash.map');
	const trim = require('lodash.trim');
	const words = require('lodash.words');
	const logger = require('../config/logger').logger;
	const async = require('async');
	const nodemailer = require('nodemailer');
	const bcrypt = require('bcrypt-nodejs');
	const crypto = require('crypto');
	const Discogs = require('disconnect').Client;

	const { User } = require('../models/user');

	const SMTP_URL = process.env.SMTP_URL;
	const FROM_EMAIL = process.env.FROM_EMAIL;

	const router = express.Router();

	const db = new Discogs({
		consumerKey: process.env.CONSUMER_KEY,
		consumerSecret: process.env.CONSUMER_SECRET,
	}).database();

	const isLoggedIn = (req, res, next) => {
		req.isAuthenticated() ? next() : res.redirect('/entrance');
	};

	const sanitizeInputs = (req) => {
		req.sanitizeBody('artist').trim();
		req.sanitizeBody('album').trim();
		req.sanitizeBody('releaseYear').trim();
		req.sanitizeBody('purchaseDate').trim();
		req.sanitizeBody('genre').trim();
		req.sanitizeBody('rating').trim();
		req.sanitizeBody('mood').trim();
		req.sanitizeBody('playCount').trim();
		req.sanitizeBody('notes').trim();
		req.sanitizeBody('vinylColor').trim();
		req.sanitizeBody('accolades').trim();
		req.sanitizeBody('discogsId').trim();
		return req;
	};

	// ROOT / HOMEPAGE
	router.get('/', (req, res) => {
		res.render('index', {
			title: 'LpDB',
			tagline: 'Your personal vinyl discography, always at your fingertips.',
			user: req.user,
			message: req.flash('success'),
		});
	});

	// SEARCH VIEW
	router.get('/search', isLoggedIn, (req, res) => {
		res.render('search', {
			user: req.user,
			message: req.flash('no-results'),
		});
	});

	// SEARCH RESULTS VIEW
	router.get('/search/results', isLoggedIn, (req, res) => {
		res.render('search-results', {
			userId: req.session.userId,
			artist: req.session.searchResult.artists[0].name,
			album: req.session.searchResult.title,
			genre: req.session.searchResult.genres[0],
			thumb: req.session.searchResult.images[0].resource_url,
			year: req.session.searchResult.year,
			discogsId: req.session.searchResult.id,
			user: req.user,
		});
	});

	// SEARCH DETAILS VIEW
	router.get('/search/details', isLoggedIn, (req, res) => {
		res.render('search-details', {
			userId: req.session.userId,
			artist: req.session.searchResult.artists[0].name,
			album: req.session.searchResult.title,
			genre: req.session.searchResult.genres[0],
			thumb: req.session.searchResult.images[0].resource_url,
			year: req.session.searchResult.year,
			discogsId: req.session.searchResult.id,
			user: req.user,
		});
	});

	// COLLECTION VIEW
	router.get('/collection', isLoggedIn, (req, res) => {
		res.render('collection', {
			user: req.user,
			music: req.user.music,
		});
	});

	// COLLECTION DETAILS VIEW
	router.get('/collection/details', isLoggedIn, (req, res) => {
		res.render('collection-details', { user: req.user });
	});

	// COLLECTION EDIT VIEW
	router.get('/collection/details/edit', isLoggedIn, (req, res) => {
		res.render('collection-edit', { user: req.user });
	});

	// SIGN-UP CONTROLLER
	router.post(
		'/signup',
		passport.authenticate('local-signup', {
			successRedirect: '/collection',
			failureRedirect: '/entrance',
			failureFlash: true,
		})
	);

	// SIGN-IN CONTROLLER
	router.post(
		'/login',
		passport.authenticate('local-login', {
			successRedirect: '/collection',
			failureRedirect: '/entrance',
			failureFlash: true,
		})
	);

	// SIGN-IN / SIGN-UP VIEW
	router.get('/entrance', (req, res) => {
		res.render('entrance', {
			user: req.user,
			loginMessage: req.flash('loginMessage'),
			signupMessage: req.flash('signupMessage'),
		});
	});

	// FORGOT VIEW
	router
		.route('/forgot')
		.get((req, res) => {
			res.render('forgot', {
				user: req.user,
				message: req.flash('info'),
			});
		})
		.post((req, res, next) => {
			async.waterfall(
				[
					(done) => {
						crypto.randomBytes(20, (err, buf) => {
							const token = buf.toString('hex');
							done(err, token);
						});
					},
					(token, done) => {
						// SANITIZE
						req.sanitizeBody('email').normalizeEmail({
							all_lowercase: true,
							gmail_remove_dots: false,
						});
						req.sanitizeBody('email').escape();
						req.sanitizeBody('email').trim();

						User.findOne({ email: req.body.email }, (err, user) => {
							if (!user) {
								req.flash(
									'info',
									"Hmm, we can't find an account associated with that email. Try again please."
								);
								return res.redirect('/forgot');
							}
							user.resetPasswordToken = token;
							user.resetPasswordExpires = Date.now() + 3600000; // 1 HOUR

							user.save((err) => done(err, token, user));
						});
					},
					(token, user, done) => {
						const transporter = nodemailer.createTransport(SMTP_URL);
						const emailData = {
							to: user.email,
							from: FROM_EMAIL,
							subject: 'VinylDB Password Reset',
							text:
								`${'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
									'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
									'http://'}${req.headers.host}/reset/${token}\n\n` +
									`If you did not request this, please ignore this email and your password will remain unchanged.\n`,
						};
						transporter.sendMail(emailData, (err) => {
							req.flash('info', `An e-mail has been sent to ${user.email} with further instructions.`);
							done(err, done);
						});
					},
				],
				(err) => {
					if (err) return next(err);
					res.redirect('/forgot');
				}
			);
		});

	// RESET PASSWORD VIEW
	router
		.route('/reset/:token')
		.get((req, res) => {
			User.findOne(
				{
					resetPasswordToken: req.params.token,
					resetPasswordExpires: { $gt: Date.now() },
				},
				(err, user) => {
					if (!user) {
						req.flash('error', 'Password reset token is invalid or has expired.');
						return res.redirect('/forgot');
					}
					res.render('reset', {
						user: req.user,
						message: req.flash('info'),
					});
				}
			);
		})
		.post((req, res) => {
			async.waterfall(
				[
					(done) => {
						User.findOne(
							{
								resetPasswordToken: req.params.token,
								resetPasswordExpires: { $gt: Date.now() },
							},
							(err, user) => {
								if (!user) {
									req.flash('error', 'Password reset token is invalid or has expired.');
									return res.redirect('back');
								}
								user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
								user.resetPasswordToken = undefined;
								user.resetPasswordExpires = undefined;

								user.save((err) => {
									req.logIn(user, (err) => {
										done(err, user);
									});
								});
							}
						);
					},
					(user, done) => {
						const transporter = nodemailer.createTransport(SMTP_URL);
						const emailData = {
							to: user.email,
							from: FROM_EMAIL,
							subject: 'Your password has been changed',
							text: `Hello,\n\n This is a confirmation that the password for your account ${user.email} has just been changed.\n`,
						};
						transporter.sendMail(emailData, (err) => {
							req.flash('success', 'Success! Your password has been changed.');
							done(err, done);
						});
					},
				],
				(err) => res.redirect('/')
			);
		});

	// LOGOUT HANDLER
	router.get('/logout', (req, res) => {
		req.logout();
		req.session.destroy();
		return res.redirect('/');
	});

	//= ================================================
	// RECORD API CRUD OPERATIONS =====================
	//= ================================================

	// RETRIEVE ALL RECORDS
	router.get('/records/:userId', (req, res) => {
		User.findById(req.params.userId)
			.then((res) => {
				const records = res.music;
				return records;
			})
			.then((records) => res.json(records))
			.catch((err) => {
				logger.error(err);
				res.status(500).json({
					error: 'INTERNAL SERVER ERROR. IT BLEW UP.',
				});
			});
	});

	// RETRIEVE RECORD BY ID
	router.get('/records/:userId/:id', (req, res) => {
		User.findById(req.params.userId)
			.then((res) => {
				const record = res.music.id(req.params.id);
				return record;
			})
			.then((record) => res.json(record))
			.catch((err) => {
				logger.error(err);
				res.status(500).json({
					error: 'INTERNAL SERVER ERROR. EVERYTHING IS ON FIRE',
				});
			});
	});

	// POST NEW RECORD
	router.post('/records/:userId', (req, res) => {
		const reqFields = [ 'artist', 'album', 'releaseYear', 'genre' ];
		map(reqFields, (field) => {
			if (!(field in req.body)) {
				const message = `Missing ${field} in the request body.`;
				logger.error(message);
				return res.status(400).send(message);
			}
		});

		User.findById(req.params.userId)
			.then((res) => {
				sanitizeInputs(req);
				const newRecord = {
					artist: req.body.artist,
					album: req.body.album,
					releaseYear: req.body.releaseYear,
					purchaseDate: req.body.purchaseDate,
					genre: req.body.genre,
					rating: req.body.rating,
					mood: req.body.mood,
					playCount: req.body.playCount,
					notes: req.body.notes,
					vinylColor: req.body.vinylColor,
					accolades: req.body.accolades,
					discogsId: req.body.discogsId,
					thumb: req.body.thumb,
				};
				res.music.push(newRecord);
				res.save();
				return newRecord;
			})
			.then((newRecord) => res.status(201).json(newRecord))
			.catch((err) => {
				logger.error(err);
				res.status(500).json({
					error: 'N-TERNAL SERVER ERROR. PRAY FOR HELP',
				});
			});
	});

	// DELETE RECORD BY ID
	router.delete('/records/:userId/:id', (req, res) => {
		User.findById(req.params.userId)
			.then((res) => {
				res.music.pull(req.params.id);
				res.save();
			})
			.then(() => {
				const message = `Successfully deleted the record with an id of ${req.params.id}`;
				logger.info(message);
				res
					.status(204)
					.json({
						message,
					})
					.end();
			})
			.catch((err) => {
				logger.error(err);
				res.status(500).json({
					error: 'INTERNAL SERVER ERROR. BREAK ALL THE WINDOWS.',
				});
			});
	});

	// UPDATE RECORD BY ID
	router.put('/records/:userId/:id', (req, res) => {
		User.findById(req.params.userId)
			.then((res) => {
				const subDoc = res.music.id(req.params.id);
				sanitizeInputs(req);
				subDoc.set(req.body);
				res.save();
			})
			.then((updatedRecord) => {
				const message = `Successfully updated the record with an id of ${req.params.id}`;
				logger.info(message);
				res.status(201).json(updatedRecord);
			})
			.catch((err) => {
				logger.error(err);
				res.status(500).json({
					error: 'INTERNAL SERVER ERROR. THE WORLD IS ENDING AS WE KNOW IT.',
				});
			});
	});

	// INCREMENT PLAY COUNT
	router.patch('/records/:userId/:id', (req, res) => {
		User.findById(req.params.userId)
			.then((res) => {
				const subDoc = res.music.id(req.params.id);
				subDoc.playCount++;
				res.save();
				return subDoc;
			})
			.then((subDoc) => {
				// RETURN UPDATED RECORD
				res.status(200).json(subDoc);
			})
			.catch((err) => {
				logger.error(err);
				res.status(500).json({
					error: 'INTERNAL SERVER ERROR. SHRED ALL THE EVIDENCE.',
				});
			});
	});

	// MAIN API CALL FOR DISCOGS SEARCH
	router.post('/search', (req, res) => {
		const artist = req.body.artist;
		const album = req.body.album;

		db
			.search(artist, {
				artist,
				title: album,
				release_title: album,
				type: 'release',
				format: 'vinyl',
			})
			.then((release) => {
				if (release.results.length > 0) {
					// MAKE CALL FOR DETAILS
					db
						.getRelease(release.results[0].id)
						.then((response) => {
							// ADD SEARCH RESULTS TO SESSION FOR RENDER IN RESULTS VIEW
							req.session.searchResult = response;
							res.json(response);
						})
						.catch((err) => {
							logger.info(err);
						});
				} else {
					// HANDLE NO RESULTS FOUND
					req.flash('no-results', "Sorry, we couldn't find that album. Please try your search again.");
					res.end();
				}
			})
			.catch((err) => {
				logger.error(err);
				res.status(500).json({
					error: 'INTERNAL SERVER ERROR. DISCOGS MACHINE BROKE.',
				});
			});
	});

	// CATCH ALL HANDLERS
	router.get('*', (req, res) => {
		res.render('404');
	});

	router.use((err, req, res) => {
		logger.error(err);
		res
			.status(500)
			.json({
				error: 'Something went wrong',
			})
			.end();
	});
	return router;
};
