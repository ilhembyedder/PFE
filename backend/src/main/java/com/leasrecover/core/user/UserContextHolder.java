package com.leasrecover.core.user;

public class UserContextHolder {
    private static final ThreadLocal<String> currentUserEmail = new ThreadLocal<>();
    
    public static void setUserEmail(String email) {
        currentUserEmail.set(email);
    }
    
    public static String getUserEmail() {
        return currentUserEmail.get();
    }
    
    public static void clear() {
        currentUserEmail.remove();
    }
}
