package com.leasrecover.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    private static final Logger log = LoggerFactory.getLogger(FileStorageConfig.class);

    @Value("${leasrecover.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created upload directory at: {}", uploadPath);
            }
            if (!Files.isWritable(uploadPath)) {
                throw new IllegalStateException(
                    "Upload directory is not writable: " + uploadPath +
                    ". Please check directory permissions.");
            }
            log.info("File storage configured. Upload directory: {}", uploadPath);
        } catch (IOException e) {
            throw new IllegalStateException(
                "Could not create or access upload directory: " + uploadPath, e);
        }
    }

    public String getUploadDir() {
        return uploadDir;
    }
}
