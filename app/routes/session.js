const UserDAO = require("../data/user-dao").UserDAO;
const AllocationsDAO = require("../data/allocations-dao").AllocationsDAO;
const logger = require('../../logger');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'internship-secret-key-change-later';
const {
    environmentalScripts
} = require("../../config/config");
 
/* The SessionHandler must be constructed with a connected db */
function SessionHandler(db) {
    "use strict";
 
    const userDAO = new UserDAO(db);
    const allocationsDAO = new AllocationsDAO(db);
 
    const prepareUserData = (user, next) => {
        const stocks = Math.floor((Math.random() * 40) + 1);
        const funds = Math.floor((Math.random() * 40) + 1);
        const bonds = 100 - (stocks + funds);
 
        allocationsDAO.update(user._id, stocks, funds, bonds, (err) => {
            if (err) return next(err);
        });
    };
 
    this.isAdminUserMiddleware = (req, res, next) => {
        if (req.session.userId) {
            return userDAO.getUserById(req.session.userId, (err, user) => {
               return user && user.isAdmin ? next() : res.redirect("/login");
            });
        }
        console.log("redirecting to login");
        return res.redirect("/login");
    };
 
    this.isLoggedInMiddleware = (req, res, next) => {
        if (req.session.userId) {
            return next();
        }
        console.log("redirecting to login");
        return res.redirect("/login");
    };
 
    this.displayLoginPage = (req, res, next) => {
        return res.render("login", {
            userName: "",
            password: "",
            loginError: "",
            environmentalScripts
        });
    };
 
    this.handleLoginRequest = (req, res, next) => {
        const {
            userName,
            password
        } = req.body;
 
        userDAO.validateLogin(userName, password, (err, user) => {
            const invalidUserNameErrorMessage = "Invalid username";
            const invalidPasswordErrorMessage = "Invalid password";
 
            if (err) {
                logger.warn(`Failed login attempt: user '${userName}' from ${req.ip}`);
                if (err.noSuchUser) {
                    return res.render("login", {
                        userName: userName,
                        password: "",
                        loginError: invalidUserNameErrorMessage,
                        environmentalScripts
                    });
                } else if (err.invalidPassword) {
                    return res.render("login", {
                        userName: userName,
                        password: "",
                        loginError: invalidPasswordErrorMessage,
                        environmentalScripts
                    });
                } else {
                    return next(err);
                }
            }
 
            const token = jwt.sign(
                { id: user._id, username: user.userName },
                SECRET_KEY,
                { expiresIn: '1h' }
            );
            logger.info(`Login success: user ${userName} from ${req.ip}`);
            req.session.userId = user._id;
            req.session.token = token;
            return res.redirect(user.isAdmin ? "/benefits" : "/dashboard");
        });
    };
 
    this.displayLogoutPage = (req, res) => {
        req.session.destroy(() => res.redirect("/"));
    };
 
    this.displaySignupPage = (req, res) => {
        res.render("signup", {
            userName: "",
            password: "",
            passwordError: "",
            email: "",
            userNameError: "",
            emailError: "",
            verifyError: "",
            environmentalScripts
        });
    };
 
    const validateSignup = (userName, firstName, lastName, password, verify, email, errors) => {
        const USER_RE = /^.{1,20}$/;
        const FNAME_RE = /^.{1,100}$/;
        const LNAME_RE = /^.{1,100}$/;
        const EMAIL_RE = /^[\S]+@[\S]+\.[\S]+$/;
        const PASS_RE = /^.{1,20}$/;
 
        errors.userNameError = "";
        errors.firstNameError = "";
        errors.lastNameError = "";
        errors.passwordError = "";
        errors.verifyError = "";
        errors.emailError = "";
 
        if (!USER_RE.test(userName)) {
            errors.userNameError = "Invalid user name.";
            return false;
        }
        if (!FNAME_RE.test(firstName)) {
            errors.firstNameError = "Invalid first name.";
            return false;
        }
        if (!LNAME_RE.test(lastName)) {
            errors.lastNameError = "Invalid last name.";
            return false;
        }
        if (!PASS_RE.test(password)) {
            errors.passwordError = "Password must be 8 to 18 characters including numbers, lowercase and uppercase letters.";
            return false;
        }
        if (password !== verify) {
            errors.verifyError = "Password must match";
            return false;
        }
        if (email !== "") {
            if (!EMAIL_RE.test(email)) {
                errors.emailError = "Invalid email address";
                return false;
            }
        }
        return true;
    };
 
    this.handleSignup = (req, res, next) => {
        const {
            email,
            userName,
            firstName,
            lastName,
            password,
            verify
        } = req.body;
 
        const errors = {
            "userName": userName,
            "email": email
        };
 
        if (!validator.isEmail(email)) {
            errors.emailError = "Invalid email address.";
            return res.render("signup", { ...errors, environmentalScripts });
        }
        if (!validator.isAlphanumeric(userName)) {
            errors.userNameError = "Username: letters and numbers only.";
            return res.render("signup", { ...errors, environmentalScripts });
        }
        const cleanUserName = validator.escape(userName);
 
        if (validateSignup(cleanUserName, firstName, lastName, password, verify, email, errors)) {
            userDAO.getUserByUserName(cleanUserName, (err, user) => {
                if (err) return next(err);
 
                if (user) {
                    errors.userNameError = "User name already in use. Please choose another";
                    return res.render("signup", { ...errors, environmentalScripts });
                }
 
                userDAO.addUser(cleanUserName, firstName, lastName, password, email, async (err, user) => {
                    if (err) return next(err);
 
                    prepareUserData(user, next);
                    req.session.regenerate(() => {
                        req.session.userId = user._id;
                        user.userId = user._id;
                        return res.render("dashboard", { ...user, environmentalScripts });
                    });
                });
            });
        } else {
            console.log("user did not validate");
            return res.render("signup", { ...errors, environmentalScripts });
        }
    };
 
    this.displayWelcomePage = (req, res, next) => {
        let userId;
 
        if (!req.session.userId) {
            console.log("welcome: Unable to identify user...redirecting to login");
            return res.redirect("/login");
        }
 
        userId = req.session.userId;
 
        userDAO.getUserById(userId, (err, doc) => {
            if (err) return next(err);
            doc.userId = userId;
            return res.render("dashboard", { ...doc, environmentalScripts });
        });
    };
}
 
module.exports = SessionHandler;