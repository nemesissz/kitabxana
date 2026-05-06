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
    const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://api.muhasibatjurnal.az' 
      : `http://localhost:${process.env.PORT || 3000}`);
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
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
    const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://api.muhasibatjurnal.az' 
      : `http://localhost:${process.env.PORT || 3000}`);
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
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
    const subject = 'Mühasibat Jurnalına xoş gəlmisiniz!';
    const html = `
      <h1>Mühasibat Jurnalına xoş gəlmisiniz!</h1>
      <p>Qeydiyyatınız uğurla tamamlandı.</p>
      <p>Xidmətlərimizdən istifadə etmək üçün abunəlik planlarımızla tanış ola bilərsiniz.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendPaymentConfirmation(to, paymentDetails) {
    const subject = 'Ödəniş təsdiqi';
    
    // Tarih formatlaması - hem created_at hem de createdAt destekler
    let formattedDate = 'Tarix məlumatı mövcud deyil';
    try {
      const dateValue = paymentDetails.created_at || paymentDetails.createdAt;
      if (dateValue) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          // Azerbaycan dilində formatla
          const formatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Baku'
          };

          formattedDate = date.toLocaleString('az-AZ', formatOptions);
        }
      }
    } catch (error) {
      console.error('Tarix formatlama xətası:', error);
      formattedDate = new Date().toLocaleString('az-AZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Baku'
      });
    }
    
    const html = `
      <h1>Ödənişiniz uğurla tamamlandı</h1>
      <p>Ödəniş məlumatları:</p>
      <ul>
        <li>Məbləğ: ${paymentDetails.amount} AZN</li>
        <li>Növ: ${paymentDetails.type === 'subscription' ? 'Abunəlik' : 'PDF'}</li>
        <li>Tarix: ${formattedDate}</li>
      </ul>
      <p>Hörmətlə,<br>Mühasibat Jurnalı komandası</p>
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
      <p>Mühasibat Jurnalı komandası</p>
    `;

    const attachments = [{
      filename: pdfPath.split('/').pop(),
      path: pdfPath,
      contentType: 'application/pdf'
    }];
    
    return this.sendEmail(to, subject, html, attachments);
  }

  async sendNewPdfNotification(to, pdfDetails) {
    const subject = '📚 Yeni PDF əlavə edildi!';
    const baseUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://muhasibatjurnal.az' 
      : 'http://localhost:5173');
    const pdfUrl = `${baseUrl}/library/${pdfDetails.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #032062 0%, #1e3a8a 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">📚 Yeni PDF Əlavə Edildi!</h1>
        </div>
        
        <div style="background-color: #fff; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #032062; margin-top: 0; font-size: 24px;">${pdfDetails.title}</h2>
          
          ${pdfDetails.description ? `
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              ${pdfDetails.description.length > 200 ? pdfDetails.description.substring(0, 200) + '...' : pdfDetails.description}
            </p>
          ` : ''}
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666; font-weight: 600;">Qiymət:</span>
              <span style="color: #032062; font-size: 20px; font-weight: 700;">${pdfDetails.price} AZN</span>
            </div>
            ${pdfDetails.category ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #666; font-weight: 600;">Kateqoriya:</span>
                <span style="color: #032062; font-weight: 600;">${pdfDetails.category}</span>
              </div>
            ` : ''}
            ${pdfDetails.language ? `
              <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                <span style="color: #666; font-weight: 600;">Dil:</span>
                <span style="color: #032062; font-weight: 600;">${pdfDetails.language.toUpperCase()}</span>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${pdfUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #032062 0%, #1e3a8a 100%); 
                      color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(3, 32, 98, 0.3);">
              PDF-i Görmək
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #999; font-size: 14px;">
          <p>Bu email bütün istifadəçilərə avtomatik göndərilmişdir.</p>
          <p>Hörmətlə,<br>Mühasibat Jurnalı komandası</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
}

export default new EmailService();