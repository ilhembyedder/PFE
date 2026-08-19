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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public static AssigneeResponse fromEntity(AppUser user) {
        AssigneeResponse response = new AssigneeResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        return response;
    }
}
