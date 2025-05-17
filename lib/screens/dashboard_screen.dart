import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // Import provider
import '../models/user_state.dart'; // Import your UserState model

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start, // Align items to the top
          crossAxisAlignment: CrossAxisAlignment.stretch, // Stretch items horizontally
          children: <Widget>[
            // Placeholder for "Welcome [username]" text
            Padding(
              padding: const EdgeInsets.all(16.0), // Add some padding
              child: Text(
                'Welcome ${context.watch<UserState>().username}', // Use provider to get username
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            ),
            SizedBox(height: 20),
            // Placeholder for Graphs (Salinity, DO, pH, Temperature, Turbidity)
            Container(
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey), // Add a border to visualize the container
              ), // Adjust height as needed for your graphs
              child: Center(
                child: Text(
                  'Placeholder for Salinity Graph',
                  style: TextStyle(fontSize: 18),
                ),
              ),
            ),
            SizedBox(height: 10), // Add spacing between graph placeholders
            Container(
              height: 200,
              decoration: BoxDecoration(border: Border.all(color: Colors.grey)), // Adjust height as needed
              child: Center(child: Text('Placeholder for DO Graph', style: TextStyle(fontSize: 18))),
            ),
            SizedBox(height: 10),
            Container(
              height: 200,
              decoration: BoxDecoration(border: Border.all(color: Colors.grey)), // Adjust height as needed
              child: Center(child: Text('Placeholder for pH Graph', style: TextStyle(fontSize: 18))),
            ),
            SizedBox(height: 10),
            Container(
              height: 200,
              decoration: BoxDecoration(border: Border.all(color: Colors.grey)), // Adjust height as needed
              child: Center(child: Text('Placeholder for Temperature Graph', style: TextStyle(fontSize: 18))),
            ),
            SizedBox(height: 10),
            Container(
              height: 200,
              decoration: BoxDecoration(border: Border.all(color: Colors.grey)), // Adjust height as needed
              child: Center(child: Text('Placeholder for Turbidity Graph', style: TextStyle(fontSize: 18))),
            ),
            SizedBox(height: 20),
            // Placeholder for Normalization Button
            ElevatedButton(
              onPressed: () {
                // Add normalization logic here
              },
              child: Text('Normalize Parameters'),
            ),
            SizedBox(height: 10),
            // Placeholder for Summary Button
            ElevatedButton(
              onPressed: () {
                // Add logic to view summary here
              },
              child: Text('View Summary'),
            ),
          ],
        ),
      ),
    );
  }
}