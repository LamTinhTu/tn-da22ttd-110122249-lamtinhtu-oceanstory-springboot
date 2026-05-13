package com.ocean.backend.exception;

public class StoryNotFoundException extends RuntimeException {

    public StoryNotFoundException(String message) {
        super(message);
    }
}
