import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { usePathname, Link } from 'expo-router';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Video as LucideIcon } from 'lucide-react-native';

interface TabItem {
  name: string;
  href: string;
  icon: LucideIcon;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
}

const TabBar: React.FC<TabBarProps> = ({ tabs }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Link key={tab.name} href={tab.href} asChild>
          <TouchableOpacity 
            style={[
              styles.tab, 
              isActive(tab.href) && styles.activeTab
            ]}
          >
            <tab.icon 
              size={24} 
              color={isActive(tab.href) ? COLORS.primary : COLORS.gray} 
            />
            <Text 
              style={[
                styles.tabLabel, 
                isActive(tab.href) && styles.activeTabLabel
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        </Link>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    ...Platform.select({
      web: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      },
      default: {
        elevation: 8,
        shadowColor: COLORS.black,
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  activeTab: {
    borderRadius: 8,
    backgroundColor: `${COLORS.primaryLight}20`,
  },
  tabLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.xs,
    color: COLORS.gray,
    marginTop: 4,
  },
  activeTabLabel: {
    color: COLORS.primary,
  },
});

export default TabBar;