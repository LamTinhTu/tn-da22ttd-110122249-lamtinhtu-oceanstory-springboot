package com.ocean.backend.dto;

public class ConnectionStatusResponse {

    private String backend;
    private String database;
    private long userCount;

    public ConnectionStatusResponse(String backend, String database, long userCount) {
        this.backend = backend;
        this.database = database;
        this.userCount = userCount;
    }

    public String getBackend() {
        return backend;
    }

    public void setBackend(String backend) {
        this.backend = backend;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public long getUserCount() {
        return userCount;
    }

    public void setUserCount(long userCount) {
        this.userCount = userCount;
    }
}
