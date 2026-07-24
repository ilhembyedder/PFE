package com.leasrecover._common.audit;

import com.leasrecover.core.user.UserContextHolder;
import org.hibernate.envers.RevisionListener;

public class AuditRevisionListener implements RevisionListener {
    @Override
    public void newRevision(Object revisionEntity) {
        AuditRevisionEntity entity = (AuditRevisionEntity) revisionEntity;
        entity.setUserId(UserContextHolder.getUserEmail());
    }
}
