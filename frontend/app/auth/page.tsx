"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"
import AuthContent from "./auth-content"

export default function AuthPage() {
    return (
        <GoogleOAuthProvider clientId= "212676002216-mcn8d008etpp02tf7ujenk8l54isqo27.apps.googleusercontent.com" >
            <AuthContent />
        </GoogleOAuthProvider>
    )
}