import 'package:flutter/material.dart';
import 'dart:math';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import 'package:myapp/models/user_state.dart';
import 'firebase_options.dart';


// Di main.dart, modifikasi untuk memeriksa status login
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  final prefs = await SharedPreferences.getInstance();
  final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

  runApp(
    ChangeNotifierProvider(
      create: (context) => UserState(),
      child: WaterMonitoringApp(isLoggedIn: isLoggedIn)));
}


class WaterMonitoringApp extends StatelessWidget {
  final bool isLoggedIn;
  
  const WaterMonitoringApp({super.key, this.isLoggedIn = false});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Water Quality Monitoring',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      initialRoute: isLoggedIn ? '/dashboard' : '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/dashboard': (context) => const MonitoringDashboard(),
      },
    );
  }
}


// User model
class User {
  final String username;
  final String password;

  User({required this.username, required this.password});
}

// Login Screen
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String _errorMessage = '';

  // Mock user database
  final List<User> _users = [
    User(username: 'admin', password: 'admin123'),
    User(username: 'user', password: 'user123'),
  ];

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // Di LoginScreen, modifikasi _login() untuk membaca pengguna dari SharedPreferences
Future<void> _login() async {
  if (_formKey.currentState!.validate()) {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    try {
      final firestore = FirebaseFirestore.instance;
      final userQuery = await firestore
        .collection('Users')
        .where('username', isEqualTo: username)
        .where('password', isEqualTo: password)
        .get();

      if (userQuery.docs.isNotEmpty) {
          // Simpan username ke SharedPreferences
         final prefs = await SharedPreferences.getInstance();
         await prefs.setBool('isLoggedIn', true); // tambahan agar tetap bisa login saat buka ulang
         await prefs.setString('username', username); // SIMPAN USERNAME

         if (!mounted) return;
         Navigator.pushReplacement(
           context,
           MaterialPageRoute(builder: (context) => const MonitoringDashboard()),
       );

      } else {
        setState(() {
          _errorMessage = 'Invalid username or password';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Login failed: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo or app icon
                Icon(
                  Icons.water_drop,
                  size: 80,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 16),
                
                // App name
                Text(
                  'Water Quality Monitoring',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 32),
                
                // Username field
                TextFormField(
                  controller: _usernameController,
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    prefixIcon: Icon(Icons.person),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your username';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Password field
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                
                // Error message
                if (_errorMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      _errorMessage,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                
                // Login button
                ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Login'),
                ),
                const SizedBox(height: 16),
                
                // Register link
                TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const RegisterScreen()),
                    );
                  },
                  child: const Text('Don\'t have an account? Register'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Register Screen
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String _errorMessage = '';

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  // Di RegisterScreen, tambahkan kode untuk menyimpan pengguna baru
Future<void> _register() async {
  if (_formKey.currentState!.validate()) {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    try {
      final firestore = FirebaseFirestore.instance;

      // Cek apakah username sudah ada
      final existingUser = await firestore
          .collection('Users')
          .where('username', isEqualTo: username)
          .get();

      if (existingUser.docs.isNotEmpty) {
        setState(() {
          _errorMessage = 'Username already exists';
          _isLoading = false;
        });
        return;
      }

      // Simpan user baru
      await firestore.collection('Users').add({
        'username': username,
        'password': password,
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registration successful! You can now login.'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() {
        _errorMessage = 'Registration failed: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Register'),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Username field
                TextFormField(
                  controller: _usernameController,
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    prefixIcon: Icon(Icons.person),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a username';
                    }
                    if (value.length < 4) {
                      return 'Username must be at least 4 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Password field
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a password';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Confirm password field
                TextFormField(
                  controller: _confirmPasswordController,
                  decoration: const InputDecoration(
                    labelText: 'Confirm Password',
                    prefixIcon: Icon(Icons.lock_outline),
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                
                // Error message
                if (_errorMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      _errorMessage,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                
                // Register button
                ElevatedButton(
                  onPressed: _isLoading ? null : _register,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Register'),
                ),
                const SizedBox(height: 16),
                
                // Login link
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: const Text('Already have an account? Login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Main Dashboard
class MonitoringDashboard extends StatefulWidget {
  const MonitoringDashboard({super.key});

  @override
  State<MonitoringDashboard> createState() => _MonitoringDashboardState();
}

class _MonitoringDashboardState extends State<MonitoringDashboard> {
  // Current values for water parameters
  double phValue = 7.0;
  double salinityValue = 35.0;
  double doValue = 6.5;
  double temperatureValue = 25.0;
  
  // Historical data for charts
  List<double> phHistory = [];
  List<double> salinityHistory = [];
  List<double> doHistory = [];
  List<double> temperatureHistory = [];
  
  // Status indicators
  String phStatus = "Normal";
  String salinityStatus = "Normal";
  String doStatus = "Normal";
  String temperatureStatus = "Normal";
  
  // Username from login
  String username = "User";
  
  late Timer _timer;

  
  @override
  void initState() {
    super.initState();
    
    // Load username
    _loadUsername();
    
    // Initialize with some historical data
    for (int i = 0; i < 10; i++) {
      phHistory.add(7.0 + Random().nextDouble() * 0.5 - 0.25);
      salinityHistory.add(35.0 + Random().nextDouble() * 3.0 - 1.5);
      doHistory.add(6.5 + Random().nextDouble() * 1.0 - 0.5);
      temperatureHistory.add(25.0 + Random().nextDouble() * 2.0 - 1.0);
    }
    
    // Simulate real-time data updates
    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _updateValues();
    });
  }
  
  Future<void> _loadUsername() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      username = prefs.getString('username') ?? "User";
    });
  }
  
  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }
  
  void _updateValues() {
    setState(() {
      // Simulate new readings with small random changes
      phValue = phValue + Random().nextDouble() * 0.4 - 0.2;
      phValue = double.parse(phValue.toStringAsFixed(2));
      phValue = phValue.clamp(6.0, 9.0);
      
      salinityValue = salinityValue + Random().nextDouble() * 1.0 - 0.5;
      salinityValue = double.parse(salinityValue.toStringAsFixed(1));
      salinityValue = salinityValue.clamp(30.0, 40.0);
      
      doValue = doValue + Random().nextDouble() * 0.6 - 0.3;
      doValue = double.parse(doValue.toStringAsFixed(2));
      doValue = doValue.clamp(5.0, 8.0);
      
      temperatureValue = temperatureValue + Random().nextDouble() * 0.8 - 0.4;
      temperatureValue = double.parse(temperatureValue.toStringAsFixed(1));
      temperatureValue = temperatureValue.clamp(20.0, 30.0);
      
      // Update history
      phHistory.add(phValue);
      salinityHistory.add(salinityValue);
      doHistory.add(doValue);
      temperatureHistory.add(temperatureValue);
      
      // Keep history at a reasonable size
      if (phHistory.length > 20) {
        phHistory.removeAt(0);
        salinityHistory.removeAt(0);
        doHistory.removeAt(0);
        temperatureHistory.removeAt(0);
      }
      
      // Update status indicators
      _updateStatus();
    });
  }
  
  void _updateStatus() {
    // pH status
    if (phValue < 6.5) {
      phStatus = "Too Acidic";
    } else if (phValue > 8.5) {
      phStatus = "Too Alkaline";
    } else {
      phStatus = "Normal";
    }
    
    // Salinity status
    if (salinityValue < 32.0) {
      salinityStatus = "Low";
    } else if (salinityValue > 38.0) {
      salinityStatus = "High";
    } else {
      salinityStatus = "Normal";
    }
    
    // DO status
    if (doValue < 5.5) {
      doStatus = "Low";
    } else if (doValue > 7.5) {
      doStatus = "High";
    } else {
      doStatus = "Normal";
    }
    
    // Temperature status
    if (temperatureValue < 22.0) {
      temperatureStatus = "Cold";
    } else if (temperatureValue > 28.0) {
      temperatureStatus = "Warm";
    } else {
      temperatureStatus = "Normal";
    }
  }

  // Normalize parameter functions
  void _normalizePh() {
    setState(() {
      phValue = 7.0;
      phStatus = "Normal";
      phHistory.add(phValue);
      if (phHistory.length > 20) {
        phHistory.removeAt(0);
      }
    });
    _showNormalizeSuccess("pH");
  }
  
  void _normalizeSalinity() {
    setState(() {
      salinityValue = 35.0;
      salinityStatus = "Normal";
      salinityHistory.add(salinityValue);
      if (salinityHistory.length > 20) {
        salinityHistory.removeAt(0);
      }
    });
    _showNormalizeSuccess("Salinity");
  }
  
  void _normalizeDo() {
    setState(() {
      doValue = 6.5;
      doStatus = "Normal";
      doHistory.add(doValue);
      if (doHistory.length > 20) {
        doHistory.removeAt(0);
      }
    });
    _showNormalizeSuccess("Dissolved Oxygen");
  }
  
  void _normalizeTemperature() {
    setState(() {
      temperatureValue = 25.0;
      temperatureStatus = "Normal";
      temperatureHistory.add(temperatureValue);
      if (temperatureHistory.length > 20) {
        temperatureHistory.removeAt(0);
      }
    });
    _showNormalizeSuccess("Temperature");
  }
  
  void _showNormalizeSuccess(String parameter) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$parameter normalized successfully'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isLoggedIn', false);
    
    if (!mounted) return;
    
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        title: const Text('Water Quality Monitoring'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _updateValues,
            tooltip: 'Refresh data',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome message
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      child: Text(username.isNotEmpty ? username[0].toUpperCase() : 'U'),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome, $username',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Last login: ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year} ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 8),
            
            const Text(
              'Current Readings',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            
            // Grid of parameter cards
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildParameterCard(
                  title: 'pH Level',
                  value: phValue,
                  unit: '',
                  icon: Icons.water_drop,
                  color: _getStatusColor(phStatus),
                  status: phStatus,
                  history: phHistory,
                  onNormalize: phStatus != "Normal" ? _normalizePh : null,
                ),
                _buildParameterCard(
                  title: 'Salinity',
                  value: salinityValue,
                  unit: 'ppt',
                  icon: Icons.grain,
                  color: _getStatusColor(salinityStatus),
                  status: salinityStatus,
                  history: salinityHistory,
                  onNormalize: salinityStatus != "Normal" ? _normalizeSalinity : null,
                ),
                _buildParameterCard(
                  title: 'Dissolved Oxygen',
                  value: doValue,
                  unit: 'mg/L',
                  icon: Icons.air,
                  color: _getStatusColor(doStatus),
                  status: doStatus,
                  history: doHistory,
                  onNormalize: doStatus != "Normal" ? _normalizeDo : null,
                ),
                _buildParameterCard(
                  title: 'Temperature',
                  value: temperatureValue,
                  unit: '°C',
                  icon: Icons.thermostat,
                  color: _getStatusColor(temperatureStatus),
                  status: temperatureStatus,
                  history: temperatureHistory,
                  onNormalize: temperatureStatus != "Normal" ? _normalizeTemperature : null,
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            

// Water quality summary
Card(
  elevation: 2,
  child: Padding(
    padding: const EdgeInsets.all(16.0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Water Quality Summary',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        _buildSummaryItem(
          'pH Level', 
          phValue.toString(), 
          phStatus,
          onNormalize: phStatus != "Normal" ? _normalizePh : null,
        ),
        _buildSummaryItem(
          'Salinity', 
          '$salinityValue ppt', 
          salinityStatus,
          onNormalize: salinityStatus != "Normal" ? _normalizeSalinity : null,
        ),
        _buildSummaryItem(
          'Dissolved Oxygen', 
          '$doValue mg/L', 
          doStatus,
          onNormalize: doStatus != "Normal" ? _normalizeDo : null,
        ),
        _buildSummaryItem(
          'Temperature', 
          '$temperatureValue °C', 
          temperatureStatus,
          onNormalize: temperatureStatus != "Normal" ? _normalizeTemperature : null,
        ),
        const SizedBox(height: 8),
        Text(
          'Last updated: ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    ),
  ),
),



        ],
      ),
    ),
    floatingActionButton: FloatingActionButton(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HistoryScreen(
            phHistory: phHistory,
            salinityHistory: salinityHistory,
            doHistory: doHistory,
            temperatureHistory: temperatureHistory,
          )),
        );
      },
      tooltip: 'View History',
      child: const Icon(Icons.history),
    ),
  );
}
  
  Widget _buildParameterCard({
  required String title,
  required double value,
  required String unit,
  required IconData icon,
  required Color color,
  required String status,
  required List<double> history,
  VoidCallback? onNormalize,
}) {
  return Card(
    elevation: 3,
    child: Padding(
      padding: const EdgeInsets.all(12.0), // Padding lebih kecil
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min, // Memastikan ukuran minimal
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 20), // Ikon lebih kecil
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), // Padding lebih kecil
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 10, // Font lebih kecil
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8), // Jarak lebih kecil
          Text(
            title,
            style: const TextStyle(
              fontSize: 14, // Font lebih kecil
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4), // Jarak lebih kecil
          Row(
            children: [
              Text(
                value.toString(),
                style: const TextStyle(
                  fontSize: 20, // Font lebih kecil
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 2), // Jarak lebih kecil
              Text(
                unit,
                style: TextStyle(
                  fontSize: 12, // Font lebih kecil
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8), // Jarak lebih kecil
          SizedBox(
            height: 30, // Grafik lebih kecil
            child: _buildMiniChart(history, color),
          ),
          if (onNormalize != null) ...[
            const SizedBox(height: 6), // Jarak lebih kecil
            SizedBox(
              width: double.infinity,
              height: 28, // Tombol lebih kecil
              child: ElevatedButton.icon(
                onPressed: onNormalize,
                icon: const Icon(Icons.settings_backup_restore, size: 12), // Ikon lebih kecil
                label: const Text('Normalize', style: TextStyle(fontSize: 10)), // Font lebih kecil
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8), // Padding lebih kecil
                  backgroundColor: color.withOpacity(0.8),
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ],
      ),
    ),
  );
}

  
  Widget _buildMiniChart(List<double> data, Color color) {
    return CustomPaint(
      size: const Size(double.infinity, 40),
      painter: ChartPainter(data, color),
    );
  }
  
  Widget _buildSummaryItem(String parameter, String value, String status, {VoidCallback? onNormalize}) {
  final Color statusColor = _getStatusColor(status);
  
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 6.0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              flex: 2,
              child: Text(
                parameter,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
            Expanded(
              flex: 2,
              child: Text(value),
            ),
            Expanded(
              flex: 1,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          ],
        ),
        // Tambahkan tombol normalisasi jika status tidak normal
        if (status != "Normal" && onNormalize != null) ...[
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: onNormalize,
              icon: Icon(Icons.settings_backup_restore, size: 14, color: statusColor),
              label: Text(
                'Normalize',
                style: TextStyle(fontSize: 12, color: statusColor),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                minimumSize: const Size(0, 24),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ),
        ],
      ],
    ),
  );
}

  
  Color _getStatusColor(String status) {
    switch (status) {
      case 'Normal':
        return Colors.green;
      case 'Low':
      case 'Cold':
      case 'Too Acidic':
        return Colors.blue;
      case 'High':
      case 'Warm':
      case 'Too Alkaline':
        return Colors.orange;
      default:
        return Colors.red;
    }
  }
}

class CustomSharedPreferences {
}

// History Screen
class HistoryScreen extends StatelessWidget {
  final List<double> phHistory;
  final List<double> salinityHistory;
  final List<double> doHistory;
  final List<double> temperatureHistory;
  
  const HistoryScreen({
    super.key,
    required this.phHistory,
    required this.salinityHistory,
    required this.doHistory,
    required this.temperatureHistory,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Parameter History'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHistorySection('pH Level History', phHistory, Colors.blue),
            const SizedBox(height: 24),
            _buildHistorySection('Salinity History', salinityHistory, Colors.orange),
            const SizedBox(height: 24),
            _buildHistorySection('Dissolved Oxygen History', doHistory, Colors.green),
            const SizedBox(height: 24),
            _buildHistorySection('Temperature History', temperatureHistory, Colors.red),
          ],
        ),
      ),
    );
  }
  
  // Complete the _buildHistorySection method
Widget _buildHistorySection(String title, List<double> data, Color color) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      const SizedBox(height: 8),
      Container(
        height: 200,
        width: double.infinity,
        padding: const EdgeInsets.all(8.0),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        child: CustomPaint(
          painter: DetailedChartPainter(data, color),
        ),
      ),
      const SizedBox(height: 16),
      // Data points table
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columns: const [
            DataColumn(label: Text('Point')),
            DataColumn(label: Text('Value')),
            DataColumn(label: Text('Time')),
          ],
          rows: List.generate(
            data.length,
            (index) => DataRow(
              cells: [
                DataCell(Text('#${index + 1}')),
                DataCell(Text(data[index].toStringAsFixed(2))),
                DataCell(Text('${DateTime.now().subtract(Duration(minutes: (data.length - index) * 5)).hour}:${DateTime.now().subtract(Duration(minutes: (data.length - index) * 5)).minute.toString().padLeft(2, '0')}')),
              ],
            ),
          ),
        ),
      ),
    ],
  );
}
}

// Chart painter for detailed history charts
class DetailedChartPainter extends CustomPainter {
  final List<double> data;
  final Color color;
  
  DetailedChartPainter(this.data, this.color);
  
  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke;
    
    final dotPaint = Paint()
      ..color = color
      ..strokeWidth = 1.0
      ..style = PaintingStyle.fill;
    
    final path = Path();
    
    // Find min and max for scaling
    final double minValue = data.reduce(min);
    final double maxValue = data.reduce(max);
    final double range = maxValue - minValue > 0 ? maxValue - minValue : 1.0;
    
    // Add padding to the chart
    final double horizontalPadding = size.width * 0.05;
    final double verticalPadding = size.height * 0.1;
    final double chartWidth = size.width - (horizontalPadding * 2);
    final double chartHeight = size.height - (verticalPadding * 2);
    
    // Start point
    final double dx = chartWidth / (data.length - 1 > 0 ? data.length - 1 : 1);
    double x = horizontalPadding;
    double y = size.height - verticalPadding - ((data[0] - minValue) / range * chartHeight);
    
    path.moveTo(x, y);
    
    // Draw line through all points
    for (int i = 1; i < data.length; i++) {
      x = horizontalPadding + (i * dx);
      y = size.height - verticalPadding - ((data[i] - minValue) / range * chartHeight);
      path.lineTo(x, y);
    }
    
    canvas.drawPath(path, paint);
    
    // Draw dots at each data point
    for (int i = 0; i < data.length; i++) {
      x = horizontalPadding + (i * dx);
      y = size.height - verticalPadding - ((data[i] - minValue) / range * chartHeight);
      canvas.drawCircle(Offset(x, y), 4, dotPaint);
    }
    
    // Draw fill
    final fillPaint = Paint()
      ..color = color.withOpacity(0.2)
      ..style = PaintingStyle.fill;
    
    final fillPath = Path.from(path);
    fillPath.lineTo(horizontalPadding + chartWidth, size.height - verticalPadding);
    fillPath.lineTo(horizontalPadding, size.height - verticalPadding);
    fillPath.close();
    
    canvas.drawPath(fillPath, fillPaint);
    
    // Draw grid lines and labels
    final gridPaint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = 1.0;
    
    final textStyle = TextStyle(
      color: Colors.grey.shade600,
      fontSize: 10,
    );
    
    // Draw horizontal grid lines
    const int horizontalLines = 5;
    for (int i = 0; i <= horizontalLines; i++) {
      final double y = verticalPadding + (i * (chartHeight / horizontalLines));
      canvas.drawLine(
        Offset(horizontalPadding, y),
        Offset(horizontalPadding + chartWidth, y),
        gridPaint,
      );
      
      // Draw value labels
      final double value = maxValue - (i * (range / horizontalLines));
      final textSpan = TextSpan(
        text: value.toStringAsFixed(1),
        style: textStyle,
      );
      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(horizontalPadding - textPainter.width - 5, y - (textPainter.height / 2)),
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// Chart painter for mini charts in dashboard
class ChartPainter extends CustomPainter {
  final List<double> data;
  final Color color;
  
  ChartPainter(this.data, this.color);
  
  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;
    
    final path = Path();
    
    // Find min and max for scaling
    final double minValue = data.reduce(min);
    final double maxValue = data.reduce(max);
    final double range = maxValue - minValue;
    
    // Start point
    final double dx = size.width / (data.length - 1);
    double x = 0;
    double y = size.height - ((data[0] - minValue) / (range == 0 ? 1 : range) * size.height);
    
    path.moveTo(x, y);
    
    // Draw line through all points
    for (int i = 1; i < data.length; i++) {
      x = i * dx;
      y = size.height - ((data[i] - minValue) / (range == 0 ? 1 : range) * size.height);
      path.lineTo(x, y);
    }
    
    canvas.drawPath(path, paint);
    
    // Draw fill
    final fillPaint = Paint()
      ..color = color.withOpacity(0.2)
      ..style = PaintingStyle.fill;
    
    final fillPath = Path.from(path);
    fillPath.lineTo(size.width, size.height);
    fillPath.lineTo(0, size.height);
    fillPath.close();
    
    canvas.drawPath(fillPath, fillPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}