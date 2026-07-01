package com.example.auction_web.service.Impl;

import java.security.Key;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.example.auction_web.common.TokenType;
import com.example.auction_web.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j(topic = "JWT_SERVICE")
public class JwtServiceImpl implements JwtService {

    @Value("${jwt.expiryMinutes}")
    private long expiryMinutes;

    @Value("${jwt.expiryDay}")
    private long expiryDay;

    @Value("${jwt.accesskey}")
    private String accessKey;

    @Value("${jwt.resetkey}")
    private String resetKey;

    @Value("${jwt.refreshkey}")
    private String refreshKey;

    @Override
    public String extractEmail(String token, TokenType type) {
        return extractClaim(token, type, Claims::getSubject);
    }

    @Override
    public boolean isTokenValid(String token,TokenType type, UserDetails user) {
        String email = extractEmail(token, type);
        if(email.equals(user.getUsername()) && !isTokenExpired(token, type)){
            return true;
        }
        return false;
    }

    private boolean isTokenExpired(String token, TokenType type) {
        Date expiration = extractClaim(token, type, Claims::getExpiration);
        return expiration.before(new Date());
    }

    private <T> T extractClaim(String token, TokenType type, Function<Claims,T> claimsExtractor) {
        final Claims claims = extractAllClaim(token,type);
        return claimsExtractor.apply(claims);
    }

    private Claims extractAllClaim(String token, TokenType type) {
        try {
            return Jwts.parser()
                .verifyWith((SecretKey)getKey(type))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (Exception e) {
            throw new AccessDeniedException("Invalid token: " + e.getMessage());
        }
        
    }
    
    private Claims extractAllClaimSafe(String token, TokenType type) {
        try {
            return Jwts.parser()
                .verifyWith((SecretKey)getKey(type))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (Exception e) {
            log.warn("Token parsing failed: {}", e.getMessage());
            return null;
        }
    }
    
    @Override
    public String extractEmailSafe(String token, TokenType type) {
        try {
            final Claims claims = extractAllClaimSafe(token, type);
            if (claims == null) {
                return null;
            }
            return claims.getSubject();
        } catch (Exception e) {
            log.warn("Failed to extract email safely: {}", e.getMessage());
            return null;
        }
    }
    
    @Override
    public boolean isTokenExpiredSafe(String token, TokenType type) {
        try {
            final Claims claims = extractAllClaimSafe(token, type);
            if (claims == null) {
                return true; // Consider invalid token as expired
            }
            Date expiration = claims.getExpiration();
            return expiration == null || expiration.before(new Date());
        } catch (Exception e) {
            log.warn("Failed to check token expiration safely: {}", e.getMessage());
            return true; // Consider any error as token being expired/invalid
        }
    }

    @Override
    public String generateResetToken(long userId, String email, Collection<? extends GrantedAuthority> authorities) {
        

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", authorities);
        claims.put("userId", userId);


        return generateResetToken(claims, email);
    }

    

    @Override
    public String generateRefreshToken(long userId, String email, Collection<? extends GrantedAuthority> authorities) {
        

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", authorities);
        claims.put("userId", userId);


        return generateRefreshToken(claims, email);
    }

    @Override
    public String generateAccessToken(long userId, String email, Collection<? extends GrantedAuthority> authorities) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", authorities);
        claims.put("userId", userId);


        return generateToken(claims, email);
    }

    private String generateResetToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*60))
                .signWith(getKey(TokenType.RESET_TOKEN))
                .compact();
    }

    private String generateRefreshToken(Map<String, Object> claims, String subject) {
        
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*60*24*expiryDay))
                .signWith(getKey(TokenType.REFRESHTOKEN))
                .compact();
    }

    private String generateToken(Map<String, Object> claims, String subject) {
        
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*expiryMinutes))
                .signWith(getKey(TokenType.ACCESSTOKEN))
                .compact();
    }

    private Key getKey(TokenType type) {
        if (type == TokenType.ACCESSTOKEN) {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(this.accessKey));
        }

        if (type == TokenType.REFRESHTOKEN) {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(this.refreshKey));
        }

        if (type == TokenType.RESET_TOKEN) {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(this.resetKey));
        }

        throw new IllegalArgumentException("Invalid token type");
    }

    
    
}
