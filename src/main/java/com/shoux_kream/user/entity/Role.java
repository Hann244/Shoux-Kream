package com.shoux_kream.user.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Role {
    USER("ROLE_USER"),
    ADMIN("ROLE_ADMIN");

    private String value;
}
