/* eslint-disable lines-around-comment */
import React, { useEffect } from 'react';
import { WithTranslation } from 'react-i18next';

import { createInviteDialogEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState } from '../../../../app/types';
import { getInviteURL } from '../../../../base/connection/functions';
import { translate } from '../../../../base/i18n/functions';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { connect } from '../../../../base/redux/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { isDynamicBrandingDataLoaded } from '../../../../dynamic-branding/functions.any';
import { isVpaasMeeting } from '../../../../jaas/functions';
import { getActiveSession } from '../../../../recording/functions';
// @ts-ignore
import { updateDialInNumbers } from '../../../actions';
import {
    _getDefaultPhoneNumber,
    getInviteText,
    getInviteTextiOS,
    isAddPeopleEnabled,
    isDialOutEnabled,
    isSharingEnabled,
    sharingFeatures
    // @ts-ignore
} from '../../../functions';

import CopyMeetingLinkSection from './CopyMeetingLinkSection';
import DialInLimit from './DialInLimit';
// @ts-ignore
import DialInSection from './DialInSection';
import InviteByEmailSection from './InviteByEmailSection';
// @ts-ignore
import InviteContactsSection from './InviteContactsSection';
// @ts-ignore
import LiveStreamSection from './LiveStreamSection';
/* eslint-enable lines-around-comment */

interface IProps extends WithTranslation {

    /**
     * The object representing the dialIn feature.
     */
    _dialIn: any;

    /**
     * Whether or not dial in number should be visible.
     */
    _dialInVisible: boolean;

    /**
     * Whether or not email sharing features should be visible.
     */
    _emailSharingVisible: boolean;

    /**
     * The meeting invitation text.
     */
    _invitationText: string;

    /**
     * The custom no new-lines meeting invitation text for iOS default email.
     * Needed because of this mailto: iOS issue: https://developer.apple.com/forums/thread/681023.
     */
    _invitationTextiOS: string;

    /**
     * An alternate app name to be displayed in the email subject.
     */
    _inviteAppName?: string;

    /**
     * Whether or not invite contacts should be visible.
     */
    _inviteContactsVisible: boolean;

    /**
     * The current url of the conference to be copied onto the clipboard.
     */
    _inviteUrl: string;

    /**
     * Whether or not the current meeting belongs to a JaaS user.
     */
    _isVpaasMeeting: boolean;

    /**
     * The current known URL for a live stream in progress.
     */
    _liveStreamViewURL: string;

    /**
     * The default phone number.
     */
    _phoneNumber?: string;

    /**
     * Whether or not url sharing button should be visible.
     */
    _urlSharingVisible: boolean;

    /**
     * Method to update the dial in numbers.
     */
    updateNumbers: Function;
}

/**
 * Invite More component.
 *
 * @returns {React$Element<any>}
 */
function AddPeopleDialog({
    _dialIn,
    _dialInVisible,
    _urlSharingVisible,
    _emailSharingVisible,
    _invitationText,
    _invitationTextiOS,
    _inviteAppName,
    _inviteContactsVisible,
    _inviteUrl,
    _isVpaasMeeting,
    _liveStreamViewURL,
    _phoneNumber,
    t,
    updateNumbers
}: IProps) {

    /**
     * Updates the dial-in numbers.
     */
    useEffect(() => {
        if (!_dialIn.numbers) {
            updateNumbers();
        }
    }, []);

    /**
     * Sends analytics events when the dialog opens/closes.
     *
     * @returns {void}
     */
    useEffect(() => {
        sendAnalytics(createInviteDialogEvent(
            'opened', 'dialog'));

        return () => {
            sendAnalytics(createInviteDialogEvent(
                'closed', 'dialog'));
        };
    }, []);

    const inviteSubject = t('addPeople.inviteMoreMailSubject', {
        appName: _inviteAppName ?? interfaceConfig.APP_NAME
    });

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = 'addPeople.inviteMorePrompt'>
            <div className = 'invite-more-dialog'>
                { _inviteContactsVisible && <InviteContactsSection /> }
                {_urlSharingVisible ? <CopyMeetingLinkSection url = { _inviteUrl } /> : null}
                {
                    _emailSharingVisible
                        ? <InviteByEmailSection
                            inviteSubject = { inviteSubject }
                            inviteText = { _invitationText }
                            inviteTextiOS = { _invitationTextiOS } />
                        : null
                }
                <div className = 'invite-more-dialog separator' />
                {
                    _liveStreamViewURL
                        && <LiveStreamSection liveStreamViewURL = { _liveStreamViewURL } />
                }
                {
                    _phoneNumber
                        && _dialInVisible
                        && <DialInSection phoneNumber = { _phoneNumber } />
                }
                {
                    !_phoneNumber && _dialInVisible && _isVpaasMeeting && <DialInLimit />
                }
            </div>
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code AddPeopleDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const currentLiveStreamingSession
        = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);
    const { iAmRecorder, inviteAppName } = state['features/base/config'];
    const addPeopleEnabled = isAddPeopleEnabled(state);
    const dialOutEnabled = isDialOutEnabled(state);
    const hideInviteContacts = iAmRecorder || (!addPeopleEnabled && !dialOutEnabled);
    const dialIn = state['features/invite'];
    const phoneNumber = dialIn?.numbers ? _getDefaultPhoneNumber(dialIn.numbers) : undefined;

    return {
        _dialIn: dialIn,
        _dialInVisible: isSharingEnabled(sharingFeatures.dialIn),
        _urlSharingVisible: isDynamicBrandingDataLoaded(state) && isSharingEnabled(sharingFeatures.url),
        _emailSharingVisible: isSharingEnabled(sharingFeatures.email),
        _invitationText: getInviteText({ state,
            phoneNumber,
            t: ownProps.t }),
        _invitationTextiOS: getInviteTextiOS({ state,
            phoneNumber,
            t: ownProps.t }),
        _inviteAppName: inviteAppName,
        _inviteContactsVisible: interfaceConfig.ENABLE_DIAL_OUT && !hideInviteContacts,
        _inviteUrl: getInviteURL(state),
        _isVpaasMeeting: isVpaasMeeting(state),
        _liveStreamViewURL: currentLiveStreamingSession?.liveStreamViewURL,
        _phoneNumber: phoneNumber
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {IProps}
 */
const mapDispatchToProps = {
    updateNumbers: () => updateDialInNumbers()
};

export default translate(
    connect(mapStateToProps, mapDispatchToProps)(AddPeopleDialog)
);
