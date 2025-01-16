import nodemailer from "nodemailer";

export const sendOtp = async (email: string, otp: string): Promise<void> => {
    try {
        // Create a transporter for sending emails
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Define the email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Verification',
            text: `Your OTP code is: ${otp}`,
        }

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);

    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP');
    }
};