import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface PatientDetailsProps {
  onSymptomSelect: (symptom: string) => void;
  selectedSymptoms: string[];
}

const symptoms = [
  { id: 'dizziness', name: 'Dizziness', color: '#3363AD' },
  { id: 'knee_joint', name: 'Knee joint', color: '#3363AD' },
  { id: 'nausea', name: 'Nausea', color: '#3363AD' },
  { id: 'shaking', name: 'Shaking', color: '#3363AD' },
];

const socialFactors = [
  { id: 'drug_use', name: 'Drug use' },
  { id: 'alcoholic', name: 'Alcoholic' },
  { id: 'childhood_trauma', name: 'Childhood trauma' },
  { id: 'connected', name: 'Connected' },
];

export default function PatientDetails({ onSymptomSelect, selectedSymptoms }: PatientDetailsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient&apos;s Details</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        {symptoms.map((symptom) => (
          <TouchableOpacity
            key={symptom.id}
            style={[
              styles.symptomItem,
              selectedSymptoms.includes(symptom.id) && styles.selectedSymptom
            ]}
            onPress={() => onSymptomSelect(symptom.id)}
          >
            <View style={[styles.bulletPoint, { backgroundColor: symptom.color }]} />
            <Text style={styles.symptomText}>{symptom.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social life</Text>
        {socialFactors.map((factor) => (
          <View key={factor.id} style={styles.factorItem}>
            <View style={[styles.bulletPoint, { backgroundColor: '#3363AD' }]} />
            <Text style={styles.factorText}>{factor.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 110,
    // backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    // borderRightWidth: 1,
    // borderRightColor: '#e0e0e0',
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  selectedSymptom: {
    backgroundColor: '#f0f0f0',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  symptomText: {
    fontSize: 8,
    color: '#333',
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 2,
  },
  factorText: {
    fontSize: 8,
    color: '#333',
  },
});