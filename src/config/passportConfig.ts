import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { configDotenv } from 'dotenv';
configDotenv();

// if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
//     throw new Error("Google client credentials are missing");
// }

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const userData = {
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value || '',
                    profileUrl: profile.photos?.[0]?.value || '',
                };

                console.log("userData in passport: ", userData);
                done(null, userData); // Send user data to req.user
            } catch (error) {
                done(error, undefined);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    console.log("serializeUser :", user);
    done(null, user); // Serialize the user object
});

passport.deserializeUser((user: any, done) => {
    console.log("deserializeUser :", user);
    done(null, user); // Deserialize the user object
});

export default passport;

