import nodemailer from "nodemailer";

export const sendEmail = async (email: string, subject: string, text: string, html?: string): Promise<void> => {
    try {
        // Create an email transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Define email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            text,
            html: html || text, 
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
};


export const sendOtp = async (email: string, otp: string): Promise<void> => {
    const subject = "Your OTP for Verification";
    const text = `Your OTP code is: ${otp}`;
    const html = `<p>Your OTP code is: <strong>${otp}</strong></p>`;

    await sendEmail(email, subject, text, html);
};

export const sendResetPasswordLink = async (email: string, resetLink: string): Promise<void> => {
    const subject = "Password Reset Request";
    const text = `Click the link below to reset your password:\n\n${resetLink}`;
    const html = `<p>Click the link below to reset your password:</p>
                  <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
                  <p>If you did not request this, please ignore this email.</p>`;

    await sendEmail(email, subject, text, html);
};


