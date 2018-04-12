const express = require('express')
const router = express.Router()
//models require
const Campground = require('../models/campground')
const Comment = require('../models/comment')

//Comments new
router.get('/campgrounds/:id/comments/new', isLoggedIn, (req, res) => {
	//see SHOW campground route for method
	Campground.findById(req.params.id, function(err, foundCamp) {
		if (err) {
			console.log(err)
		} else {
			res.render('comments/new', { campground: foundCamp })
		}
	})
})

//Comments create
router.post('/campgrounds/:id/comments', isLoggedIn, function(req, res) {
	//Create a new comment and save it to DB:
	Campground.findById(req.params.id, function(err, foundCamp) {
		if (err) {
			console.log(err)
			res.redirect('/campgrounds')
		} else {
			// get data from form and add to campground comments
			//but instead of these 3 sentences:
			//var author = req.body.comment.author
			//var text = req.body.comment.text
			//var newComment = {author, text}
			//we just use comment[array] sent from new.ejs
			Comment.create(req.body.comment, function(err, new_comm) {
				if (err) {
					console.log(err)
				} else {
					//add username and id to comment
					new_comm.author.id = req.user._id
					new_comm.author.username = req.user.username
					//save comment
					new_comm.save()
					//push it into the comments
					foundCamp.comments.push(new_comm)
					foundCamp.save()
					// redirect back to campground, default is GET campground:
					res.redirect('/campgrounds/' + foundCamp._id)
				}
			})
		}
	})
})
//Edit comment route
router.get(
	'/campgrounds/:id/comments/:comment_id/edit',
	checkCommentOwnership,
	(req, res) => {
		Comment.findById(req.params.comment_id, (err, foundComment) => {
			if (err) res.redirect('back')
			else
				res.render('comments/edit', {
					comment: foundComment,
					campground_id: req.params.id
				})
		})
	}
)
//Update comment route
router.put(
	'/campgrounds/:id/comments/:comment_id',
	checkCommentOwnership,
	(req, res) => {
		Comment.findByIdAndUpdate(
			req.params.comment_id,
			req.body.comment,
			(err, updatedComment) => {
				if (err) res.redirect('back')
				else res.redirect(`/campgrounds/${req.params.id}`)
			}
		)
	}
)
// Destroy comment route
router.delete(
	'/campgrounds/:id/comments/:comment_id',
	checkCommentOwnership,
	(req, res) => {
		// res.send('YOU ARE TRYING TO ERASE ME!!! :()')
		Comment.findByIdAndRemove(req.params.comment_id, (err, deletedComment) => {
			res.redirect(`/campgrounds/${req.params.id}`)
		})
	}
)

//checks if is logged in before doing the next step
//this functions as a middleware, use it after a route, before the callback
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next()
	}
	res.redirect('/login')
}

//checks if the current user is the owner (author) of the current comment
function checkCommentOwnership(req, res, next) {
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, (err, foundComment) => {
			if (err) res.redirect('back')
			else {
				//	//does user own comment?
				//mongoose stores authorid as an mongoose object, not string so to compare them
				// we use mongoose method equals()
				if (foundComment.author.id.equals(req.user._id)) next()
				else res.redirect('back')
			}
		})
	} else res.redirect('back') //takes the user to the 'previous' page
}

module.exports = router
