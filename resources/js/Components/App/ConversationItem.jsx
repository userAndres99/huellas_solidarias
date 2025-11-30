import { Link, usePage } from "@inertiajs/react";
import UserAvatar from './UserAvatar';
import GroupAvatar from './GroupAvatar';
import UserOptionsDropdown from './UserOptionsDropdown';
import { formatMessageDateShort, previewText } from "@/helpers";

const ConversationItem = ({
    conversation,
    selectedConversation = null,
    online = null,
    onSelect = null,
    unreadCount = 0,
}) => {
    const page = usePage();
    const currentUser = page.props.auth.user;
    let classes = "border-transparent";
  
    if(selectedConversation){
        if(
            !selectedConversation.is_group &&
            !conversation.is_group &&
            selectedConversation.id === conversation.id
        ){
            classes = "border-blue-500 bg-black/20";
        }
        if(
            selectedConversation.is_group &&
            conversation.is_group &&
            selectedConversation.id == conversation.id
        ){
            classes = "border-blue-500 bg-gray/20";
        }
    }
    const Container = onSelect ? 'div' : Link;

    const selectProps = onSelect
        ? {
              role: 'button',
              tabIndex: 0,
              onClick: () => onSelect(conversation),
              onKeyDown: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(conversation);
                  }
              },
          }
        : {};

    return (
        <Container
            {...selectProps}
            href={!onSelect ? (conversation.is_group ? route('chat.group', conversation) : route('chat.user', conversation)) : undefined}
            className={
                'conversation-item w-full flex items-center gap-2 p-2 text-gray-300 transition-all cursor-pointer border-l-4 hover:bg-black/30 ' +
                classes +
                (conversation.is_user && currentUser.is_admin ? ' pr-2' : ' pr-4')
            }
        >
            {conversation.is_user && (
                <div className="flex-shrink-0">
                    <UserAvatar user={conversation} online={online}/>
                </div>
            )}
            {conversation.is_group && <GroupAvatar/>}
            <div
                className={
                    `flex-1 text-xs max-w-full overflow-hidden text-left min-w-0 ` +
                    (conversation.is_user && conversation.blocked_at
                        ? "opacity-50"
                        : ""
                    )
                }
            >
                <div className="grid grid-cols-[1fr_3rem] gap-2 items-center">
                    <h3 className="text-sm font-semibold text-white truncate min-w-0">
                        {conversation.name}
                    </h3>
                    {conversation.last_message_date && (
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-xs opacity-60 text-right">
                                {formatMessageDateShort(conversation.last_message_date)}
                            </span>
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-500 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    )}
                    {conversation.last_message && (
                        <p className="text-xs text-gray-300 truncate mt-1 col-start-1 col-end-2">
                            {previewText(conversation.last_message, 6)}
                        </p>
                    )}
                </div>

            </div>
            {conversation.is_user && (
                <UserOptionsDropdown conversation={conversation}/>
            )}
        
        </Container>
    );
};

export default ConversationItem;