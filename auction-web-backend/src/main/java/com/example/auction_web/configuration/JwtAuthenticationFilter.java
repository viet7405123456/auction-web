package com.example.auction_web.configuration;

import java.util.Date;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.auction_web.common.TokenType;
import com.example.auction_web.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/")
            || path.startsWith("/swagger-ui/")
            || path.startsWith("/api-docs")
            || path.startsWith("/ws/")
            || path.equals("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain)
            throws java.io.IOException, ServletException {
        log.info("Incoming request: {} {}", request.getMethod(), request.getRequestURI());
        
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;
                
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                email = jwtService.extractEmail(token, TokenType.ACCESSTOKEN);
            } catch (AccessDeniedException e) {
                log.error("JWT Token is invalid: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(e.getMessage());
                return;
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if(SecurityContextHolder.getContext().getAuthentication() == null){
                if(jwtService.isTokenValid(token,TokenType.ACCESSTOKEN, userDetails)){
                    SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,null, userDetails.getAuthorities()
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    securityContext.setAuthentication(authentication);
                    SecurityContextHolder.setContext(securityContext);
                }
            }
            
            filterChain.doFilter(request, response);
            return;
        }

        filterChain.doFilter(request, response);
        log.info("Outgoing response: {} {}", response.getStatus(), request.getRequestURI());
    }


    @Setter
    @Getter
    private class ErrorResponse{
        private Date timestamp;
        private int status;
        private String error;
        private String message;
    }
}
