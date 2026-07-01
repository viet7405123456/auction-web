package com.example.auction_web.configuration;



import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {

        log.error("❌ ACCESS DENIED");
        log.error("👉 URL: {}", request.getRequestURI());
        log.error("👉 Method: {}", request.getMethod());
        log.error("👉 Reason: {}", accessDeniedException.getMessage());

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        String errorMessage = accessDeniedException.getMessage();
        
        // Handle JWT expiration
        if (errorMessage != null && errorMessage.contains("JWT") && errorMessage.contains("expired")) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("""
                {
                  "status": 401,
                  "error": "UNAUTHORIZED",
                  "message": "Your authentication token has expired. Please login again."
                }
            """);
            return;
        }
        
        // Handle invalid token
        if (errorMessage != null && errorMessage.contains("Invalid token")) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("""
                {
                  "status": 401,
                  "error": "UNAUTHORIZED",
                  "message": "Invalid authentication token. Please login again."
                }
            """);
            return;
        }

        response.getWriter().write("""
            {
              "status": 403,
              "error": "FORBIDDEN",
              "message": "You do not have permission to access this resource"
            }
        """);
    }
}

