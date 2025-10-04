import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import fs from 'fs';

config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

class EmailService {
  async sendEmail(to, subject, html, attachments = []) {
    // Validate email parameters
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      console.error('Invalid email recipient:', to);
      throw new Error('Invalid email recipient');
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('Email configuration missing in environment variables');
      throw new Error('Email configuration missing');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to.trim(),
      subject,
      html,
      attachments,
    };

    try {
      console.log(`Attempting to send email to: ${to}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(to, token) {
    const subject = 'Email təsdiqləmə';
    const verificationUrl = `http://localhost:${process.env.PORT}/auth/verify-email?token=${token}`;
    const html = `
      <h1>Email ünvanınızı təsdiqləyin</h1>
      <p>Email ünvanınızı təsdiqləmək üçün aşağıdakı linkə klikləyin:</p>
      <a href="${verificationUrl}">Email ünvanımı təsdiqlə</a>
      <p>Bu link 24 saat ərzində etibarlıdır.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to, token) {
    const subject = 'Şifrə yeniləmə';
    const resetUrl = `http://localhost:${process.env.PORT}/auth/reset-password?token=${token}`;
    const html = `
      <h1>Şifrənizi yeniləyin</h1>
      <p>Şifrənizi yeniləmək üçün aşağıdakı linkə klikləyin:</p>
      <a href="${resetUrl}">Şifrəmi yenilə</a>
      <p>Bu link 1 saat ərzində etibarlıdır.</p>
      <p>Əgər siz şifrə yeniləmə tələbi göndərməmisinizsə, bu emaili nəzərə almayın.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendWelcomeEmail(to) {
    const subject = 'Vergi Portalına xoş gəlmisiniz!';
    const html = `
      <h1>Vergi Portalına xoş gəlmisiniz!</h1>
      <p>Qeydiyyatınız uğurla tamamlandı.</p>
      <p>Xidmətlərimizdən istifadə etmək üçün abunəlik planlarımızla tanış ola bilərsiniz.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendPaymentConfirmation(to, paymentDetails) {
    const subject = 'Ödəniş təsdiqi';
    const html = `
      <h1>Ödənişiniz uğurla tamamlandı</h1>
      <p>Ödəniş məlumatları:</p>
      <ul>
        <li>Məbləğ: ${paymentDetails.amount} AZN</li>
        <li>Tarix: ${new Date(paymentDetails.createdAt).toLocaleString()}</li>
        <li>Növ: ${paymentDetails.type === 'subscription' ? 'Abunəlik' : 'PDF'}</li>
      </ul>
    `;

    return this.sendEmail(to, subject, html);
  }
  
  async sendPdfAsAttachment(to, pdfPath) {
    const subject = 'Satın aldığınız PDF faylı';
    const html = `
      <h1>Hörmətli istifadəçi,</h1>
      <p>Satın aldığınız PDF faylı əlavədə yerləşdirilmişdir.</p>
      <p>PDF faylını yüklədikdən sonra bu emaili təhlükəsizlik üçün silməyiniz tövsiyə olunur.</p>
      <p>Hörmətlə,</p>
      <p>Vergi Portal komandası</p>
    `;

    const attachments = [{
      filename: pdfPath.split('/').pop(),
      path: pdfPath,
      contentType: 'application/pdf'
    }];
    
    return this.sendEmail(to, subject, html, attachments);
  }
}

export default new EmailService();