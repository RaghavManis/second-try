package com.cricket.tournament.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${contact.recipient.email:your-email@gmail.com}")
    private String recipientEmail;

    // We inject the authenticated spring.mail.username to be our verified 'From' address
    @Value("${spring.mail.username}")
    private String systemEmail;

    public void sendContactEmail(String name, String fromEmail, String messageText) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(recipientEmail);
            
            // This ensures clicking 'Reply' in your email client will reply to the user's email, not to yourself
            helper.setReplyTo(fromEmail, name);
            
            // This tricks Gmail into displaying the user's name (e.g. "Neelam Yadav (SPL Website)") 
            // instead of "me", while strictly adhering to Gmail's anti-spoofing policies by using the verified underlying email
            helper.setFrom(systemEmail, name + " (SPL Website)");
            
            helper.setSubject("New Contact Message from SPL: " + name);
            
            String text = "You have received a new message from your website contact form.\n\n" +
                    "Name: " + name + "\n" +
                    "Email: " + fromEmail + "\n\n" +
                    "Message:\n" + messageText;
            
            helper.setText(text, false);
            
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new RuntimeException("Error while sending contact email: " + e.getMessage(), e);
        }
    }
}
