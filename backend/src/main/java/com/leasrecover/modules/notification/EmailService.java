package com.leasrecover.modules.notification;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String from, String to, String subject, String body) {
        log.info("Envoi d'e-mail - De: {}, À: {}, Sujet: {}", from, to, subject);
        log.info("Contenu de l'e-mail:\n{}", body);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("E-mail envoyé avec succès.");
        } catch (Exception e) {
            log.error("Échec de l'envoi de l'e-mail au client: {}", e.getMessage(), e);
        }
    }
}
