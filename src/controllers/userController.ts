import { Request, Response, NextFunction } from "express";
import { IUserController } from "../interfaces/user/IUserController";
import { IUserService } from "../interfaces/user/IUserService";
import passport from 'passport';
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';
import { IUser } from "../models/userModel";
import { PutObjectCommand } from '@aws-sdk/client-s3';

import { configDotenv } from 'dotenv';
configDotenv();

export class UserController implements IUserController {

    constructor(private userService: IUserService) { };

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Email and password are required.',
                });
                return;
            }

            const { accessToken, refreshToken, user } = await this.userService.login(email, password);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            const userData = { name: user.name, email: user.email }

            console.log("Login successfull!");
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Login successful!",
                token: accessToken,
                role: "user",
                data: userData
            });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.NOT_FOUND || error.status === HTTP_STATUS.UNAUTHORIZED) {
                res.status(error.status).json({ message: error.message });
                return;
            }

            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async signUp(req: Request, res: Response): Promise<void> {
        try {
            const userData = req.body;
            await this.userService.signUp(userData);

            res.status(HTTP_STATUS.OK).json({ success: true });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.CONFLICT) {
                res.status(HTTP_STATUS.CONFLICT).json({ message: error.message });
                return;
            }

            console.error("Error while signup : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<any> {
        try {
            const { email, otp } = req.body;

            console.log("email:", email);
            console.log("OTP:", otp);

            if (!email || !otp) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Email and OTP are required!" });
            }

            const { accessToken, refreshToken, user } = await this.userService.verifyOtp(email, otp);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                // maxAge: 24 * 60 * 60 * 1000,  
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            const userData = { name: user.name, email: user.email };

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: "OTP verification successful, user created!",
                token: accessToken,
                data: userData
            });

        } catch (error: any) {

            if (error.status === 401) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: error.message
                });
            }

            console.error("Error while verifying otp : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            await this.userService.resendOtp(email);
            res.status(HTTP_STATUS.OK).json({ success: true });
        } catch (error: any) {
            console.error("Error while resending otp : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    // async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //         passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    //     } catch (error) {
    //         console.log("Error in controller googleAuth:",error);
    //         next(error);  // Pass errors to the next middleware (error handler)
    //     }
    // }

    // async googleAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     passport.authenticate('google', async (error:any, userData: any) => {
    //         if (error || !userData) {
    //             return res.status(401).json({ message: "Authentication failed" });
    //         }

    //         try {
    //             // Call userService to handle Google Auth logic
    //             const { accessToken, refreshToken } = await this.userService.handleGoogleAuth(userData);

    //             res.cookie("refreshToken", refreshToken, {
    //                 httpOnly: true,
    //                 secure: process.env.NODE_ENV === "production",
    //                 maxAge: 24 * 60 * 60 * 1000, // 1 day
    //             });

    //             res.status(200).json({
    //                 success: true,
    //                 message: "Authentication successful",
    //                 token: accessToken,
    //             });
    //         } catch (err) {
    //             console.error("Error in googleAuthCallback:", err);
    //             next(err);
    //         }
    //     })(req, res, next);
    // }

    async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
        } catch (error) {
            console.log("Error in controller googleAuth:", error);
            next(error); // Pass errors to the next middleware (error handler)
        }
    }

    // async googleAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     passport.authenticate('google', async (error: any, userData: any) => {
    //         if (error || !userData) {
    //             return res.redirect('/user/google/failure'); // Redirect to failure page
    //         }

    //         try {
    //             // Call userService to handle Google Auth logic
    //             const { accessToken, refreshToken } = await this.userService.handleGoogleAuth(userData);

    //             // Set cookies or send token
    //             res.cookie("refreshToken", refreshToken, {
    //                 httpOnly: true,
    //                 secure: process.env.NODE_ENV === "production",
    //                 maxAge: 24 * 60 * 60 * 1000, // 1 day
    //             });

    //             // Redirect to success page
    //             return res.redirect(`/user/google/success?token=${accessToken}`);
    //         } catch (err) {
    //             console.error("Error in googleAuthCallback:", err);
    //             next(err);
    //         }
    //     })(req, res, next);
    // }

    // googleAuthSuccess(req: Request, res: Response): void {
    //     const { token } = req.query;

    //     if (!token) {
    //         res.status(400).json({ message: "Missing access token" });
    //         return;
    //     }

    //     // res.status(200).json({
    //     //     success: true,
    //     //     message: "Authentication successful",
    //     //     token: token,
    //     // });

    //     // return res.redirect(
    //     //     `http://localhost:5173//?token=${token}`
    //     // );

    //     const html = `
    //     <!DOCTYPE html>
    //     <html>
    //         <body>
    //             <script>
    //                 window.opener.postMessage(
    //                     { 
    //                         type: "GOOGLE_AUTH_SUCCESS", 
    //                         token: "${token}" 
    //                     }, 
    //                     "http://localhost:5173"  // Your frontend origin
    //                 );
    //                 window.close();
    //             </script>
    //         </body>
    //     </html>
    // `;

    //     res.send(html);


    // }

    // googleAuthFailure(req: Request, res: Response): void {
    //     // res.status(401).json({
    //     //     success: false,
    //     //     message: "Authentication failed. Please try again.",
    //     // });

    //     const html = `
    //         <!DOCTYPE html>
    //         <html>
    //             <body>
    //                 <script>
    //                     window.opener.postMessage(
    //                         { 
    //                             type: "GOOGLE_AUTH_FAILURE",
    //                             error: "Authentication failed"
    //                         }, 
    //                         "http://localhost:5173"  // Your frontend origin
    //                     );
    //                     window.close();
    //                 </script>
    //             </body>
    //         </html>
    //     `;

    //     res.send(html);
    // }

    // Backend: UserController
    async googleAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
        passport.authenticate('google', async (error: any, userData: any) => {
            if (error || !userData) {
                // Use relative path
                return res.redirect('/user/google/failure');
            }

            try {
                const { accessToken, refreshToken } = await this.userService.handleGoogleAuth(userData);

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 24 * 60 * 60 * 1000,
                    sameSite: 'lax',  // Add this for better cookie security
                });

                // Use relative path and encrypt token in state
                return res.redirect(`/user/google/success?token=${accessToken}`);
            } catch (err) {
                console.error("Error in googleAuthCallback:", err);
                next(err);
            }
        })(req, res, next);
    }

    googleAuthSuccess(req: Request, res: Response): void {
        const { token } = req.query;

        if (!token) {
            res.status(400).json({ message: "Missing access token" });
            return;
        }

        const html = `
        <!DOCTYPE html>
        <html>
            <body>
                <script>
                    function handleAuth() {
                        const token = "${token}";
                        
                        // Try postMessage first
                        if (window.opener) {
                            try {
                                window.opener.postMessage(
                                    { 
                                        type: "GOOGLE_AUTH_SUCCESS", 
                                        token: token 
                                    }, 
                                    "http://localhost:5173"
                                );
                                window.close();
                                return;
                            } catch (err) {
                                console.log('PostMessage failed, trying fallback');
                            }
                        }
                        
                        // Fallback: Use localStorage
                        try {
                            localStorage.setItem('tempAuthToken', token);
                            window.location.href = 'http://localhost:5173';
                        } catch (err) {
                            console.error('Auth fallback failed:', err);
                            document.body.innerHTML = 'Authentication Error. Please try again.';
                        }
                    }

                    // Execute immediately
                    handleAuth();
                </script>
                <p>Completing authentication...</p>
            </body>
        </html>
    `;

        res.send(html);
    }

    googleAuthFailure(req: Request, res: Response): void {
        const html = `
        <!DOCTYPE html>
        <html>
            <body>
                <script>
                    function handleFailure() {
                        if (window.opener) {
                            try {
                                window.opener.postMessage(
                                    { 
                                        type: "GOOGLE_AUTH_FAILURE",
                                        error: "Authentication failed"
                                    }, 
                                    "http://localhost:5173"
                                );
                                window.close();
                                return;
                            } catch (err) {
                                console.log('PostMessage failed');
                            }
                        }
                        // Fallback: redirect to error page
                        window.location.href = 'http://localhost:5173/auth-error';
                    }

                    handleFailure();
                </script>
                <p>Authentication failed. Redirecting...</p>
            </body>
        </html>
    `;

        res.send(html);
    }

    async getUser(req: Request, res: Response): Promise<void> {
        try {
            console.log("req.headers", req.headers['x-user-id']);
            const userId = req.headers['x-user-id'];
            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "invalid user id" });
                return;
            }
            const user = await this.userService.getUser(userId as string);

            const userData = {
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileUrl: user.profileUrl
            }

            console.log("userdata in controller:", userData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: userData
            });

        } catch (error: any) {
            // if (error.status === 401) {
            //     return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            //         success: false,
            //         message: error.message
            //     });
            // }

            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                })
            }

            console.error("Error while fetching user data in controller : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'];
            const { name, phone } = req.body;
            const profileImage = req.file;

            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'User ID is missing in the request headers.',
                });
                return;
            }

            const updatedData: Partial<IUser> = { name, phone };

            const updatedUser = await this.userService.updateUser(userId as string, updatedData, profileImage);

            if (!updatedUser) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found.',
                });
            }

            const userdata = {
                name: updatedUser?.name,
                email: updatedUser?.email,
                phone: updatedUser?.phone,
                profileUrl: updatedUser?.profileUrl,
            };

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: userdata,
            });
        } catch (error: any) {
            console.error('Error in updateUser controller:', error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'An internal server error occurred.',
            });
        }
    }

    async uploadProfileImage(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'];
            const profileImage = req.file;
            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'User ID is missing in the request headers.',
                });
                return;
            }


            if (!profileImage) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: "Profile image file is missing in the request.",
                });
                return;
            }

            const profileUrl = await this.userService.uploadProfileImage(userId as string, profileImage);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Profile image uploaded successfully.",
                data: { profileUrl },
            });

        } catch (error: any) {
            console.error('Error in update user profile image:', error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'An internal server error occurred.',
            });
        }
    }

    async validateRefreshToken(req: Request, res: Response): Promise<void> {
        try {

            console.log("req.cookies :", req.cookies);
            if (!req.cookies.refreshToken) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.TOKEN_NOT_FOUND,
                });
                return;
            }

            const { accessToken, refreshToken } = await this.userService.validateRefreshToken(req.cookies.refreshToken);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "token created!",
                token: accessToken,
                role:"user"
            });

        } catch (error: any) {

            if (error.status === 401) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'An internal server error occurred.',
            })
        }
    }
}