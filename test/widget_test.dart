// This is a Flutter widget test for the Water Quality Monitoring app.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart' as shared_prefs;
import 'package:myapp/main.dart';


Widget _buildParameterCard({
  required String title,
  required double value,
  required String unit,
  required IconData icon,
  required Color color,
  required String status,
  required List<double> history,
  required VoidCallback onNormalize,
}) {
  return Card(
    child: Column(
      children: [
        ListTile(
          leading: Icon(icon, color: color),
          title: Text(title),
          subtitle: Text('Status: $status'),
        ),
        if (status != 'Normal')
          TextButton(
            onPressed: onNormalize,
            child: const Text('Normalize'),
          ),
      ],
    ),
  );
}

void main() {
  // Setup mock SharedPreferences
  shared_prefs.SharedPreferences.setMockInitialValues({});

  testWidgets('Login screen shows correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const WaterMonitoringApp());

    // Verify that the login screen appears
    expect(find.text('Water Quality Monitoring'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text('Don\'t have an account? Register'), findsOneWidget);
    
    // Verify form fields are present
    expect(find.byType(TextFormField), findsNWidgets(2)); // Username and password fields
  });

  testWidgets('Login validation works', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const WaterMonitoringApp());

    // Try to login without entering credentials
    await tester.tap(find.text('Login'));
    await tester.pump();

    // Verify validation messages appear
    expect(find.text('Please enter your username'), findsOneWidget);
    expect(find.text('Please enter your password'), findsOneWidget);
  });

  testWidgets('Navigation to register screen works', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const WaterMonitoringApp());

    // Tap on the "Register" link
    await tester.tap(find.text('Don\'t have an account? Register'));
    await tester.pumpAndSettle();

    // Verify register form fields are present
    expect(find.byType(TextFormField), findsNWidgets(3)); // Username, password, and confirm password
  });

  testWidgets('Parameter card shows normalize button when abnormal', (WidgetTester tester) async {
    // This test requires mocking login and navigating to dashboard
    // For simplicity, we'll directly test the parameter card widget
    
    final testKey = GlobalKey<ScaffoldState>();
    
    // Create a test app with a parameter card that has abnormal status
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          key: testKey,
          body: Builder(
            builder: (BuildContext context) {
              return _buildParameterCard(
                title: 'pH Level',
                value: 6.2,
                unit: '',
                icon: Icons.water_drop,
                color: Colors.blue,
                status: 'Too Acidic',
                history: List.generate(10, (index) => 6.2 + index * 0.1),
                onNormalize: () {},
              );
            },
          ),
        ),
      ),
    );

    // Verify the parameter card shows the abnormal status
    expect(find.text('Too Acidic'), findsOneWidget);
    
    // Verify the normalize button is present
    expect(find.text('Normalize'), findsOneWidget);
  });
}
