package com.example.auction_web.configuration;

import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class WebSocketExceptionHandler extends StompSubProtocolErrorHandler {

    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
        log.error("WebSocket message processing error: {}", ex.getMessage(), ex);
        
        Throwable cause = ex.getCause();
        if (cause != null) {
            log.error("Caused by: {}", cause.getMessage(), cause);
        }
        
        return handleInternal(StompCommand.ERROR, ex);
    }

    @Override
    public Message<byte[]> handleErrorMessageToClient(Message<byte[]> errorMessage) {
        log.error("Sending error message to client: {}", new String((byte[]) errorMessage.getPayload()));
        return super.handleErrorMessageToClient(errorMessage);
    }

    private Message<byte[]> handleInternal(StompCommand command, Throwable ex) {
        String message = ex.getMessage();
        
        // Handle JWT expiration
        if (message != null && message.contains("JWT") && message.contains("expired")) {
            message = "Your authentication token has expired. Please login again.";
        }
        // Handle generic invalid token
        else if (message != null && message.contains("Invalid token")) {
            message = "Invalid authentication token. Please login again.";
        }
        // Handle general authorization errors
        else if (message != null && message.contains("WebSocket authentication required")) {
            message = "Authentication required for WebSocket connection.";
        }
        // Default error message
        else if (message == null || message.isBlank()) {
            message = "An error occurred while processing your request.";
        }
        
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.ERROR);
        accessor.setMessage(message);
        accessor.setLeaveMutable(true);
        
        return MessageBuilder.createMessage(message.getBytes(), accessor.getMessageHeaders());
    }
}
