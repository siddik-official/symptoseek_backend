// test-appointments.js - Test script for appointment system
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
    userToken: 'your-user-jwt-token-here', // Replace with actual user token
    adminToken: 'your-admin-jwt-token-here', // Replace with actual admin token
    doctorId: 'your-doctor-id-here' // Replace with actual doctor ID
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {}
        };
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }
        
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
};

// Test functions
const testAppointmentWorkflow = async () => {
    console.log('🧪 Testing Appointment Workflow...\n');
    
    // 1. Create appointment (user)
    console.log('1. Creating appointment as user...');
    const appointmentData = {
        doctors_id: testConfig.doctorId,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        reason: 'Regular checkup'
    };
    
    const createResult = await makeRequest('POST', '/appointments', appointmentData, testConfig.userToken);
    console.log('Create Result:', createResult.success ? 'SUCCESS' : 'FAILED');
    
    if (!createResult.success) {
        console.log('Error:', createResult.error);
        return;
    }
    
    const appointmentId = createResult.data.appointment._id;
    console.log('Appointment ID:', appointmentId);
    console.log('Status:', createResult.data.appointment.status);
    
    // 2. Get user's appointments
    console.log('\n2. Getting user appointments...');
    const userAppointments = await makeRequest('GET', '/appointments/my-appointments', null, testConfig.userToken);
    console.log('User Appointments:', userAppointments.success ? 'SUCCESS' : 'FAILED');
    
    // 3. Get all appointments as admin
    console.log('\n3. Getting all appointments as admin...');
    const adminAppointments = await makeRequest('GET', '/admin/appointments', null, testConfig.adminToken);
    console.log('Admin Appointments:', adminAppointments.success ? 'SUCCESS' : 'FAILED');
    
    // 4. Approve appointment as admin
    console.log('\n4. Approving appointment as admin...');
    const approveResult = await makeRequest('PATCH', `/admin/appointments/${appointmentId}/approve`, {
        adminNote: 'Appointment approved for testing'
    }, testConfig.adminToken);
    console.log('Approve Result:', approveResult.success ? 'SUCCESS' : 'FAILED');
    
    // 5. Try to cancel approved appointment as user
    console.log('\n5. Trying to cancel approved appointment as user...');
    const cancelResult = await makeRequest('PATCH', `/appointments/${appointmentId}/cancel`, {
        reason: 'Changed my mind'
    }, testConfig.userToken);
    console.log('Cancel Result:', cancelResult.success ? 'SUCCESS' : 'FAILED');
    
    // 6. Get admin dashboard stats
    console.log('\n6. Getting admin dashboard stats...');
    const statsResult = await makeRequest('GET', '/admin/dashboard-stats', null, testConfig.adminToken);
    console.log('Stats Result:', statsResult.success ? 'SUCCESS' : 'FAILED');
    if (statsResult.success) {
        console.log('Dashboard Stats:', JSON.stringify(statsResult.data, null, 2));
    }
};

// Test admin-only endpoints
const testAdminEndpoints = async () => {
    console.log('\n🔒 Testing Admin-Only Endpoints...\n');
    
    // Test accessing admin endpoints without admin token
    console.log('1. Testing admin endpoints with user token (should fail)...');
    const userAccessResult = await makeRequest('GET', '/admin/appointments', null, testConfig.userToken);
    console.log('User Access to Admin Endpoint:', userAccessResult.success ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
    
    // Test with admin token
    console.log('\n2. Testing admin endpoints with admin token (should succeed)...');
    const adminAccessResult = await makeRequest('GET', '/admin/appointments', null, testConfig.adminToken);
    console.log('Admin Access to Admin Endpoint:', adminAccessResult.success ? 'SUCCESS' : 'FAILED');
};

// Main test runner
const runTests = async () => {
    console.log('🚀 Starting Appointment System Tests\n');
    console.log('⚠️  Make sure to update testConfig with actual tokens and IDs!\n');
    
    if (testConfig.userToken === 'your-user-jwt-token-here') {
        console.log('❌ Please update testConfig with actual user token');
        return;
    }
    
    if (testConfig.adminToken === 'your-admin-jwt-token-here') {
        console.log('❌ Please update testConfig with actual admin token');
        return;
    }
    
    if (testConfig.doctorId === 'your-doctor-id-here') {
        console.log('❌ Please update testConfig with actual doctor ID');
        return;
    }
    
    try {
        await testAppointmentWorkflow();
        await testAdminEndpoints();
        console.log('\n✅ All tests completed!');
    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
    }
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    testAppointmentWorkflow,
    testAdminEndpoints,
    makeRequest
};
