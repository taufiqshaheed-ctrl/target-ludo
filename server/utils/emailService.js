import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
import {
    verificationEmailTemplate,
    passwordResetEmailTemplate,
    welcomeEmailTemplate,
} from '../templates/emailTemplates.js';

dotenv.config();

// ─── Brevo client setup ───────────────────────────────────────────────────────
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_SMTP_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// ─── Base sender ──────────────────────────────────────────────────────────────
const sendEmail = async (to, subject, htmlContent) => {
    const mail = new SibApiV3Sdk.SendSmtpEmail();
    mail.sender = { name: process.env.EMAIL_FROM_NAME || 'Target Ludo', email: process.env.EMAIL_FROM_ADDRESS };
    mail.to = [{ email: to }];
    mail.subject = subject;
    mail.htmlContent = htmlContent;

    try {
        const result = await apiInstance.sendTransacEmail(mail);
        console.log(`[Email] Sent to ${to} | Subject: "${subject}"`);
        return result;
    } catch (err) {
        console.error(`[Email] Failed to send to ${to}:`, err?.response?.body || err.message);
        throw err;
    }
};

// ─── Auth emails ──────────────────────────────────────────────────────────────

export const sendVerificationEmail = (to, otp) =>
    sendEmail(
        to,
        'Verify Your Email – Target Ludo',
        verificationEmailTemplate(otp)
    );

export const sendPasswordResetEmail = (to, otp) =>
    sendEmail(
        to,
        'Reset Your Password – Target Ludo',
        passwordResetEmailTemplate(otp)
    );

export const sendWelcomeEmail = (to, name) =>
    sendEmail(
        to,
        'Welcome to Target Ludo! 🎲',
        welcomeEmailTemplate(name)
    );
