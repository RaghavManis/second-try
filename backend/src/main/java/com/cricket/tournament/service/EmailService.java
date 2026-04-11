package com.cricket.tournament.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${contact.recipient.email:your-email@gmail.com}")
    private String recipientEmail;

    public void sendContactEmail(String name, String fromEmail, String message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(recipientEmail);
        mailMessage.setSubject("New Contact Message from SPL: " + name);
        mailMessage.setText("You have received a new message from your website contact form.\n\n" +
                "Name: " + name + "\n" +
                "Email: " + fromEmail + "\n\n" +
                "Message:\n" + message);
        
        mailSender.send(mailMessage);
    }
}
