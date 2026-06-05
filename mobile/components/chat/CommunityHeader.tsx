import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Users, MoreVertical, Info, Bookmark } from 'lucide-react-native';
import { IConversation } from '@/types';

interface CommunityHeaderProps {
  community: IConversation;
  router: any;
  communityId: string;
  memberCount?: number;
  onSettingsPress?: () => void;
}

export function CommunityHeader({ community, router, communityId, memberCount: propMemberCount, onSettingsPress }: CommunityHeaderProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const responsiveStyles = getResponsiveHeaderStyles(width);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Get member count from prop or fallback to community data
  const memberCount = propMemberCount 
    ?? community?.participants?.length 
    ?? 0;
  
  // Use backend-calculated displayName
  const communityName = community?.displayName || community?.name || '----';

  return (
    <View style={[styles.header, { paddingTop: insets.top, paddingHorizontal: responsiveStyles.paddingHorizontal, paddingVertical: responsiveStyles.paddingVertical }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={responsiveStyles.backIconSize} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.headerInfo}
        onPress={() => router.push(`/community/${communityId}/info`)}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerName, { fontSize: responsiveStyles.headerNameSize }]}>
            {communityName}
          </Text>
          <View style={styles.memberRow}>
            <Users size={responsiveStyles.headerStatusSize} color="#D1F4CC" />
            <Text style={[styles.headerStatus, { fontSize: responsiveStyles.headerStatusSize }]}>
              {memberCount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowDropdown(true)}>
          <MoreVertical size={responsiveStyles.backIconSize} color="#FFFFFF" />
        </TouchableOpacity>

        {showDropdown && (
          <Modal transparent visible={showDropdown} onRequestClose={() => setShowDropdown(false)}>
            <TouchableOpacity
              style={dropdownStyles.overlay}
              onPress={() => setShowDropdown(false)}
              activeOpacity={1}>
              <View style={dropdownStyles.menu}>
                <TouchableOpacity
                  style={dropdownStyles.item}
                  onPress={() => {
                    setShowDropdown(false);
                    router.push(`/community/${communityId}/info`);
                  }}>
                  <Info size={16} color="#374151" />
                  <Text style={dropdownStyles.itemText}>Amakuru ya Kominote</Text>
                </TouchableOpacity>
                <View style={dropdownStyles.divider} />
                <TouchableOpacity
                  style={dropdownStyles.item}
                  onPress={() => {
                    setShowDropdown(false);
                    router.push(`/community/saved`);
                  }}>
                  <Bookmark size={16} color="#374151" />
                  <Text style={dropdownStyles.itemText}>Ibibitso byanjye</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    top: 90,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 0,
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4D81D2',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    backgroundColor: '#E9EDEF',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerStatus: {
    color: '#D1F4CC',
    marginTop: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
  },
});

function getResponsiveHeaderStyles(width: number) {
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 768;
  
  return {
    paddingHorizontal: isSmallScreen ? 4 : isLargeScreen ? 16 : 8,
    paddingVertical: isSmallScreen ? 8 : isLargeScreen ? 14 : 10,
    backIconSize: isSmallScreen ? 20 : isLargeScreen ? 28 : 24,
    headerAvatarSize: isSmallScreen ? 32 : isLargeScreen ? 48 : 40,
    headerNameSize: isSmallScreen ? 14 : isLargeScreen ? 16 : 16,
    headerStatusSize: isSmallScreen ? 12 : isLargeScreen ? 14 : 13,
    actionIconSize: isSmallScreen ? 18 : isLargeScreen ? 26 : 22,
  };
}
