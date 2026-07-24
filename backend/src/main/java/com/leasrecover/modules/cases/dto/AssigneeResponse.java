package com.leasrecover.modules.cases.dto;

import com.leasrecover.modules.users.AppUser;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class AssigneeResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;

    public static AssigneeResponse fromEntity(AppUser user) {
        AssigneeResponse response = new AssigneeResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        return response;
    }
}
