const _ = require('lodash');
const {urlDownload} = require('../config');
const nodemailer = require("nodemailer");

class Email {

    constructor(app){
        this.app = app;
    }

    sendInvitationToDownloadFiles (post, callback = () => {}){


        const app = this.app;
        const email = app.email;

        const postId = _.get(post, '_id');
        const from = _.get(post, 'from');
        const to = _.get(post, 'to');
        const message = _.get(post, 'message', '');
        const downloadLink = `${urlDownload}/share/${postId}`;

        // send mail with defined transport object
        let info = email.sendMail({
            from: from, // sender address
            to: to, // list of receivers
            subject: "[SHARE] Download Invitation", // Subject line
            text: message, // plain text body
            html: `<p>${from} has sent to you some files. Click <a href="${downloadLink}">here</a> to download</p><p>Message : \n ${message}</p>` // html body
        }, (err, info) => {
            return callback(err, info);
        });

        //console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    }

}



module.exports = {
    Email
}