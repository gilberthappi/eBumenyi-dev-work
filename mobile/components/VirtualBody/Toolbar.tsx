import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RotateCcw, Save, Upload, Download, X, FileText, Palette, Users, Hand, Pen, Square, Clock, Grid, Layers, Lightbulb } from 'lucide-react-native';

export default function Toolbar() {
  return (
    <View style={styles.toolbar}>
      <View style={styles.toolsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolGroupContent}
        >
          <View style={styles.toolGroup}>
            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <RotateCcw size={18} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>Run</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <View style={[styles.okInner]}> 
                  <Save size={16} color="#2563eb" />
                </View>
              </View>
              <Text style={styles.toolLabel}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Upload size={18} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>Insert</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Download size={18} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>Export</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <X size={18} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <FileText size={18} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>Forms</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Palette size={18} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>Therapy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Users size={18} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>Team</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.toolGroupContent, styles.secondRowContent]}
        >
          <View style={styles.toolGroup}>
            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Hand size={16} color="#4285f4" />
              </View>
              <Text style={styles.toolLabel}>Hand tools</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Pen size={16} color="#34a853" />
              </View>
              <Text style={styles.toolLabel}>Draw</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Palette size={16} color="#fbbc04" />
              </View>
              <Text style={styles.toolLabel}>Colors</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Square size={16} color="#ea4335" />
              </View>
              <Text style={styles.toolLabel}>Shapes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Clock size={16} color="#9aa0a6" />
              </View>
              <Text style={styles.toolLabel}>Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Grid size={16} color="#4e2bd8" />
              </View>
              <Text style={styles.toolLabel}>3D</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Layers size={16} color="#ff6d01" />
              </View>
              <Text style={styles.toolLabel}>Scenario</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.iconWrapper}>
                <Lightbulb size={16} color="#9c27b0" />
              </View>
              <Text style={styles.toolLabel}>Tips</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolsContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginRight: 2,
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  toolGroupContent: {
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  secondRowContent: {
    marginTop: 6,
  },
  secondRow: {
    marginTop: 1,
  },
  toolButton: {
    alignItems: 'center',
    marginHorizontal: 2,
    marginVertical: 2,
    width: 48,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toolLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 1,
    textAlign: 'center',
  },
  okInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eef5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  okInside: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  handTool: {
    width: 18,
    height: 18,
    backgroundColor: '#4285f4',
    borderRadius: 3,
  },
  drawTool: {
    width: 18,
    height: 18,
    backgroundColor: '#34a853',
    borderRadius: 9,
  },
  colorTool: {
    width: 18,
    height: 18,
    backgroundColor: '#fbbc04',
    borderRadius: 9,
  },
  shapeTool: {
    width: 18,
    height: 18,
    backgroundColor: '#ea4335',
    borderRadius: 3,
  },
  timerTool: {
    width: 18,
    height: 18,
    backgroundColor: '#9aa0a6',
    borderRadius: 9,
  },
  threeDText: {
    fontSize: 12,
    color: '#4e2bd8',
    fontWeight: '700',
  },
  scenarioTool: {
    width: 18,
    height: 18,
    backgroundColor: '#ff6d01',
    borderRadius: 3,
  },
  tipsTool: {
    width: 18,
    height: 18,
    backgroundColor: '#9c27b0',
    borderRadius: 9,
  },
  smallInner: {
    alignSelf: 'center',
  },
  aiAssistant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aiIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#34a853',
    borderRadius: 6,
    marginRight: 8,
  },
  aiText: {
    fontSize: 12,
    color: '#34a853',
    fontWeight: '600',
  },
});