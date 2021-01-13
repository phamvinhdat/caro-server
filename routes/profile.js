
var express = require('express');
var router = express.Router();

// get infomation
router.get('/me', (req, res, next) => {
    // for security, do not send password
    if (req.user.length > 0) {
        const user = req.user[0];
        const info = {
            username: user.username ,
            email: user.email,
            fullname: user.fullname,
            WinCount: user.WinCount,
            LoseCount: user.LoseCount,
            DrawCount: user.DrawCount
        }
        res.status(200).json(info);
    }
    else {
        res.status(400).json({
            message: 'Đã xảy ra lỗi, vui lòng thử lại'
        })
    }
});

module.exports = router;