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
