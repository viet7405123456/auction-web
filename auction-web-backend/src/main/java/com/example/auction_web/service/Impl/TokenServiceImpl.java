package com.example.auction_web.service.Impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.auction_web.entity.Token;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.repository.TokenRepository;
import com.example.auction_web.service.TokenService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final TokenRepository tokenRepository;

    @Override
    public String delete(Token token) {
        tokenRepository.delete(token);
        return "Deleted Token";
    }

    @Override
    public Long save(Token token) {
        Optional<Token> optional = tokenRepository.findByEmail(token.getEmail());
        if(optional.isEmpty()){
            tokenRepository.save(token);
            return token.getId();
        } else {
            Token currentToken = optional.get();
            currentToken.setAccessToken(token.getAccessToken());
            currentToken.setRefreshToken(token.getRefreshToken());
            tokenRepository.save(currentToken);
            return currentToken.getId();
        }
    }

    @Override
    public Token getByEmail(String email) {
        return tokenRepository.findByEmail(email).orElseThrow(()-> new ResourceNotFoundException("Token not exists"));
    }

}
