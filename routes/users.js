
var express = require('express');
var userModel = require('../models/users.model');
var passport = require('passport');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var router = express.Router();
var passport = require('passport');
var config = require('../config.js');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config['mail-key'])
// test loading database
router.post('/', (req, res, next) => {
    userModel.all().then(rows => {
        res.status(200).json({
            message: 'Connect database successful',
            success: true
          });
    }).catch(err => {
        res.status(400).json({
            message: 'Connect database fail',
            success: false
          });
    });
});

// register a new user
router.post('/register', (req, res, next) => {

    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var fullname = req.body.fullname;

    // check params
    if (!username || !password || !email || !fullname) {
        res.status(400).json({
            message: 'Vui lòng nhập đầy đủ thông tin',
            success: false
          });
    }
    else {
        // hash password
        var saltRounds = 10;
        var hash = bcrypt.hashSync(password, saltRounds);

        // create an entity
        var entity = {
            username: username,
            password: hash,
            email: email,
            fullname: fullname
        }
        userModel.get(username).then(rows => {
          if (rows.length !== 0) {
            return res.status(400).json({
              message: "Tên đăng nhập đã tồn tại",
              success: false
            });
          } 
          userModel
            .getEmail(email)
            .then((rows) => {
              if (rows.length !== 0) {
                return res.status(400).json({
                  message: "Email đã tồn tại",
                  success: false
              });
              }
            })
            .catch((err) => {
              return res.status(400).json({
                message: "Đã xảy ra lỗi, vui lòng thử lại",
                success: false
              });
            });
            const token = jwt.sign(
              {
                username,
                hash,
                email,
                fullname,
              },
              config['secret-key'],
              {
                expiresIn: "15m",
              }
            );
            const emailData = {
              from: "chipchipdaam@gmail.com",
              to: email,
              subject: "Kích hoạt tài khoản",
              html: `
                                  <h1>Xin chào ${fullname}. Vui lòng click vào link ở bên dưới để kích hoạt tài khoản:</h1>
                                  <p>${config['client-domain']}/activate/${token}</p>
                                  <hr />
                                  <p>Vui lòng kích hoạt tài khoản sau 15p tính từ lúc nhận được email này. Nếu không kích hoạt tài khoản trong lúc đó thì tài khoản của bạn sẽ bị xóa.</p>
                                  <p>Liên hệ chúng tôi:</p>
                                  <p>chipchipdaam@gmail.com</p>
                              `,
            };
            sgMail
              .send(emailData)
              .then((sent) => {
                return res.status(200).json({
                  message: `Thư kích hoạt đã được gửi tới địa chỉ ${email}`,
                  success: true
              });
              })
              .catch((err) => {
                return res.status(400).json({
                  message: "Đã xảy ra lỗi khi gửi thư kích hoạt, vui lòng thử lại",
                  success: false
              });
              }); 
        }).catch(err => {
            return res.status(400).json({
                message: 'Đã xảy ra lỗi, vui lòng thử lại',
                success: false
              });
        })
       
    }
});
// active a new user
router.post('/activate', (req, res, next) =>{
    const { token } = req.body;
    if (token) {
      jwt.verify(token, config['secret-key'], (err, decoded) => {
        if (err) {
          console.log("Activation error");
          return res.status(401).json({
            message: "Link kích hoạt đã hết hạn. Vui lòng đăng ký lại.",
            success: false
          });
        } else {
          const { username, hash, email, fullname } = jwt.decode(token);

          console.log(email);
          var entity = {
            username: username,
            password: hash,
            email: email,
            fullname: fullname,
          };
          //add to database
          userModel
            .add(entity)
            .then((id) => {
              res.status(200).json({
                message: "Kích hoạt tài khoản thành công",
                success: true
              });
            })
            .catch((err) => {
              var errMessage = err.code;

              switch (err.code) {
                case "ER_DUP_ENTRY":
                  errMessage = "Tài khoản đã được kích hoạt. Vui lòng vào phần đăng nhập.";
                  break;
              }

              res.status(400).json({
                message: errMessage,
                success: false
              });
            });
        }
      });
    } else {
      return res.json({
        message: "error happening please try again",
        success: false
      });
    }
})
router.post('/password/forget',  (req, res, next) =>{
  const { email } = req.body;
  userModel
    .getEmail(email)
    .then((rows) => {
      if (rows.length === 0) {
        return res.status(400).json({
          message: "Không tồn tại tài khoản với email bạn nhập",
          success: false
        });
      }else{
        const token = jwt.sign(
          {
            username: rows[0].username,
            email: rows[0].email,
            fullname: rows[0].fullname
          },
          config['secret-key'],
          {
            expiresIn: '30m'
          }
        );
        const emailData = {
          from: "chipchipdaam@gmail.com",
          to: email,
          subject: `Đặt lại mật khẩu`,
          html: `
                    <h1>Xin chào ${rows[0].fullname}. Để đặt lại mật khẩu cho tài khoản của mình, vui lòng click vào link bên dưới và tiến hành đổi mật khẩu mới</h1>
                    <p>${config['client-domain']}/password/reset/${token}</p>
                    <hr />
                    <p>Liên kết sẽ hết hạn sau 30 phút tính từ lúc nhận email.  Vui lòng đổi mật khẩu trước khi liên kết hết hạn.</p>
                    <br/>
                    <p>Liên hệ chúng tôi:</p>
                    <p>"chipchipdaam@gmail.com"</p>
                `,
        };
        sgMail
          .send(emailData)
          .then((sent) => {
            // console.log('SIGNUP EMAIL SENT', sent)
            return res.status(200).json({
               message: `Email đặt lại mật khẩu đã được gửi tới ${email}. `,
               success: true
            });
          })
          .catch((err) => {
            // console.log('SIGNUP EMAIL SENT ERROR', err)
            return res.status(400).json({
              message: "Đã xảy ra lỗi, vui lòng thử lại",
              success: false
            });
          });
      }
    })
    .catch((err) => {
      return res.status(400).json({
        message: "Đã xảy ra lỗi, vui lòng thử lại",
        success: false
      });
    });
    

})
router.post('/password/reset', (req, res, next) =>{
  const token = req.body.token;
  const newPassword =  req.body.newPassword;
  if (token) {
    jwt.verify(token, config['secret-key'], (err, decoded) => {
      if (err) {
        console.log("Reset password error");
        return res.status(401).json({
          message: "Link đặt lại mật khẩu đã hết hạn.",
          success: false
        });
      } else {
        const { username, email, fullname } = jwt.decode(token);
        //change the password
        userModel.get(username).then(rows => {
          if (rows.length === 0) {
              return res.status(400).json({
                  message: 'Tài khoản không tồn tại',
                  success: false
              });
          }
          var entity = {
            username: username,
            email: email,
            fullname: fullname,
          };

          var saltRounds = 10;
          var hash = bcrypt.hashSync(newPassword, saltRounds);
          entity.password = hash;

          // write to database
          userModel.put(entity).then(id => {
              return res.status(200).json({
                  message: 'Thay đổi mật khẩu thành công. Giờ bạn có thể đăng nhập với mật khẩu vừa đổi',
                  success: true
              });
          }).catch(err => {
              return res.status(400).json({
                  message: 'Đã xảy ra lỗi, vui lòng thử lại',
                  success: false
              });
          })
          
      }).catch(err => {
          return res.status(400).json({
              message: 'Đã xảy ra lỗi, vui lòng thử lại ',
              success: false
            });
      })
      }
    });
  } else {
    return res.json({
      message: "error happening please try again",
      success: false
    });
  }
 
})
// login with username & password
router.post('/login', (req, res, next) => {

    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).json({
                message: info.message,
            });
        }
        req.login(user, {session: false}, (err) => {
            if (err) {
                res.status(400).json({
                    message: err
                });
            }

            // generate a signed son web token with the contents of user object and return it in the response
            const token = jwt.sign(JSON.stringify(user), config['secret-key']);
            return res.json({
                user,
                token
            });
        });
    })(req, res);
});

// facebook login
router.get('/login/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/login/facebook/callback', passport.authenticate('facebook', {
    session: false,
    failureRedirect: config['client-domain'] + 'login/',
}), (req, res) => {
    const token = jwt.sign(JSON.stringify(req.user), config['secret-key']);
    res.redirect(config['client-domain'] + 'login?token=' + token + '#chouser');
});

// google login
router.get('/login/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/login/google/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: config['client-domain'] + 'login/',
}), (req, res) => {
    const token = jwt.sign(JSON.stringify(req.user), config['secret-key']);
    res.redirect(config['client-domain'] + 'login?token=' + token + '#chouser');
});

// register a new user
router.post('/changeinfo', passport.authenticate('jwt', {session: false}), (req, res, next) => {

    var username = req.body.username;
    var oldPassword = req.body.oldPassword;
    var password = req.body.password;
    var email = req.body.email;
    var fullname = req.body.fullname;

    // check params
    if (!username || !email || !fullname) {
        res.status(400).json({
            message: 'Vui lòng nhập đầy đủ thông tin',
            success: false
          });
    }
    else {
        userModel.get(username).then(rows => {
            if (rows.length === 0) {
                return res.status(400).json({
                    message: 'Tài khoản không tồn tại',
                    success: false
                  });
            }
            var user = rows[0];

            // update basic info
            var entity = {
                username: username,
                email: email,
                fullname: fullname
            }

            // update password
            if (oldPassword || password) {

                // compare password
                var ret = bcrypt.compareSync(oldPassword, user.password);
                if (!ret) {
                    return res.status(400).json({
                        message: 'Mật khẩu cũ không chính xác',
                        success: false
                });
                }
                else {
                    var saltRounds = 10;
                    var hash = bcrypt.hashSync(password, saltRounds);
                    entity.password = hash;
                }
            }

            // write to database
            userModel.put(entity).then(id => {
                return res.status(200).json({
                    message: 'Cập nhật thông tin thành công',
                    success: true
                  });
            }).catch(err => {
                return res.status(400).json({
                    message: 'Đã xảy ra lỗi, vui lòng thử lại',
                    success: false
                  });
            })
            
        }).catch(err => {
            return res.status(400).json({
                message: 'Đã xảy ra lỗi, vui lòng thử lại',
                success: false
              });
        })
    }
});
router.post('/result', passport.authenticate('jwt', {session: false}), (req, res, next) =>{
  var username = req.body.username;
  var result = req.body.result;
  
  // check params
  if (!username) {
    res.status(400).json({
        message: 'Vui lòng nhập đầy đủ thông tin'
    });
  }
    else{
      userModel
        .get(username)
        .then((rows) => {
          if (rows.length === 0) {
            return res.status(400).json({
              message: "Tài khoản không tồn tại",
            });
          }
          var user = rows[0];
          var entity = {
            username: username,
          };
          var status = '';
          switch (result){
            case 'win': {
              entity.WinCount = user.WinCount + 1;
              status =  "Chúc mừng bạn đã giành được chiến thắng !";
              break;
            }
            case 'lose':{
              entity.LoseCount = user.LoseCount + 1;
              status = "Rất tiếc bạn đã thất bại !";
              break;
            }
            default:{
              entity.DrawCount = user.DrawCount + 1;
              status =  "Đã thống nhất hòa nhau !";
              break;
            }
          }
          userModel
            .put(entity)
            .then((id) => {
              return res.status(200).json({
                message: status
              });
            })
            .catch((err) => {
             
              return res.status(400).json({
                message: err,
              });
            });
        })
        .catch((err) => {
          return res.status(400).json({
            message: err,
          });
        });
}
})

module.exports = router;