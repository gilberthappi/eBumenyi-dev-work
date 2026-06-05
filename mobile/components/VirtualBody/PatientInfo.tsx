import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PatientInfo() {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>Demography info</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age:</Text>
              <Text style={styles.infoValue}>32</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender:</Text>
              <Text style={styles.infoValue}>Female</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight:</Text>
              <Text style={styles.infoValue}>78 Kg</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Height:</Text>
              <Text style={styles.infoValue}>1.75 m</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>Health info</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medical risk:</Text>
              <Text style={styles.infoValue}>Chemotherapy</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medicine:</Text>
              <Text style={styles.infoValue}>Acetaminophen</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lab test:</Text>
              <Text style={styles.infoValue}>Mammogram</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Care Period:</Text>
              <Text style={styles.infoValue}>2 Years</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>Genetics info</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Type:</Text>
              <Text style={styles.infoValue}>AB</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Family lineage:</Text>
              <Text style={styles.infoValue}>Asthma</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Inherited:</Text>
              <Text style={styles.infoValue}>Anemia</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Environment:</Text>
              <Text style={styles.infoValue}>Smokey</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    paddingVertical: 2,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  card: {
    width: 150,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 6,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    alignSelf: 'stretch',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  infoGrid: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#4b5563',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: '700',
  },
});