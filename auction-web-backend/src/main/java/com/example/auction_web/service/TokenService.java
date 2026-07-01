package com.example.auction_web.service;

import com.example.auction_web.entity.Token;

public interface TokenService {
    
    public Long save(Token token);

    public String delete(Token token);
    
    public Token getByEmail(String email);

}
