package com.ocean.backend.service;

import com.ocean.backend.entity.ModerationAction;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.ModerationActionRepository;
import com.ocean.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModerationActionService {

    private final ModerationActionRepository moderationActionRepository;
    private final UserRepository userRepository;

    public ModerationActionService(ModerationActionRepository moderationActionRepository, UserRepository userRepository) {
        this.moderationActionRepository = moderationActionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void record(Authentication authentication,
                       String targetType,
                       Long targetId,
                       String fromStatus,
                       String toStatus,
                       String action,
                       String reason) {
        ModerationAction m = new ModerationAction();
        m.setTargetType(targetType);
        m.setTargetId(targetId);
        m.setFromStatus(fromStatus);
        m.setToStatus(toStatus);
        m.setAction(action);
        m.setReason(reason);

        if (authentication != null && authentication.isAuthenticated()) {
            User moderator = userRepository.findByUsername(authentication.getName()).orElse(null);
            m.setModerator(moderator);
        }

        moderationActionRepository.save(m);
    }
}
