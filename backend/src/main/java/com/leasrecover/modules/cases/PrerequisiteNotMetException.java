package com.leasrecover.modules.cases;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

public class PrerequisiteNotMetException extends ResponseStatusException {
    private final List<String> missingPrerequisites;

    public PrerequisiteNotMetException(List<String> missingPrerequisites) {
        super(HttpStatus.BAD_REQUEST, String.join(", ", missingPrerequisites));
        this.missingPrerequisites = missingPrerequisites;
    }

    public List<String> getMissingPrerequisites() {
        return missingPrerequisites;
    }
}
