package com.leasrecover._common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JSendResponse<T> {

    private String status;
    private T data;
    private String message;

    public JSendResponse() {}

    public JSendResponse(String status, T data, String message) {
        this.status = status;
        this.data = data;
        this.message = message;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static <T> JSendResponse<T> success(T data) {
        return new JSendResponse<>("success", data, null);
    }

    public static <T> JSendResponse<T> fail(T data) {
        return new JSendResponse<>("fail", data, null);
    }

    public static JSendResponse<Void> error(String message) {
        return new JSendResponse<>("error", null, message);
    }
}
