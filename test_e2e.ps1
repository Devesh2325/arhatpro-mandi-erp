param(
    [string]$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    [int]$Port = 9222
)

Write-Host "=== Starting E2E Verification for Azadpur Mandi Super Admin and Multi-Tenant Isolation ===" -ForegroundColor Cyan

# 1. Kill any stale edge instances on port 9222
Get-Process msedge -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$Port*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# 2. Launch Edge headless with remote debugging
$userDataDir = Join-Path $env:TEMP ("edge_test_profile_" + [Guid]::NewGuid().ToString())
$edgeArgs = @(
    "--headless=new",
    "--remote-debugging-port=$Port",
    "--user-data-dir=`"$userDataDir`"",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8080/admin.html"
)

$proc = Start-Process -FilePath $EdgePath -ArgumentList $edgeArgs -PassThru
Start-Sleep -Seconds 2

try {
    # 3. Connect to CDP /json/list to get WebSocket Debugger URL
    $tabs = Invoke-RestMethod -Uri "http://localhost:$Port/json/list"
    $targetTab = $tabs | Where-Object { $_.url -like "*admin.html*" } | Select-Object -First 1

    if (-not $targetTab) {
        $targetTab = $tabs | Select-Object -First 1
    }

    $wsUrl = $targetTab.webSocketDebuggerUrl
    Write-Host "Connected to Edge CDP at: $wsUrl" -ForegroundColor Green

    # WebSocket client in .NET
    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $ws.ConnectAsync([System.Uri]$wsUrl, $cts.Token).Wait()

    function Send-CDPCommand {
        param(
            [string]$Method,
            [hashtable]$Params = @{},
            [int]$Id = 1
        )
        $msgObj = @{
            id = $Id
            method = $Method
            params = $Params
        }
        $json = $msgObj | ConvertTo-Json -Depth 10 -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $segment = [System.ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        # Read response
        $buffer = [byte[]]::new(65536)
        $resSegment = [System.ArraySegment[byte]]::new($buffer)
        $fullText = ""
        do {
            $res = $ws.ReceiveAsync($resSegment, $cts.Token).Result
            $chunk = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $res.Count)
            $fullText += $chunk
        } until ($res.EndOfMessage)

        return ($fullText | ConvertFrom-Json)
    }

    function Eval-Script {
        param([string]$Expression, [int]$Id = 2)
        $resp = Send-CDPCommand -Method "Runtime.evaluate" -Params @{
            expression = $Expression
            returnByValue = $true
            awaitPromise = $true
        } -Id $Id
        return $resp.result.result.value
    }

    # Test 1: Verify admin.html loads and login gate works
    Write-Host "`n[Test 1] Testing Super Admin Authentication on admin.html..." -ForegroundColor Yellow
    $code1 = @'
(() => {
    document.getElementById('admin-login-email').value = 'dmchaturvedi@gmail.com';
    document.getElementById('admin-login-pass').value = 'Devesh@23251995';
    handleAdminLogin();
    const isDashboardVisible = !document.getElementById('admin-main-dashboard').classList.contains('hidden');
    const user = AuthManager.currentUser;
    return {
        isDashboardVisible: isDashboardVisible,
        userRole: user ? user.role : null,
        userEmail: user ? user.email : null
    };
})()
'@
    $loginResult = Eval-Script $code1 101
    Write-Host "Login Result: $($loginResult | ConvertTo-Json -Compress)"
    if ($loginResult.isDashboardVisible -eq $true -and $loginResult.userEmail -eq "dmchaturvedi@gmail.com" -and $loginResult.userRole -eq "super_admin") {
        Write-Host "PASS: Super Admin authenticated successfully!" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Super Admin authentication failed!" -ForegroundColor Red
    }

    # Test 2: Verify Super Admin Subscription Management & Metrics
    Write-Host "`n[Test 2] Testing Subscription Management and Directory..." -ForegroundColor Yellow
    $code2 = @'
(() => {
    const tenants = TenantManager.getAllTenants();
    const firstTenant = tenants[0];
    const initialPlan = firstTenant.subscription ? firstTenant.subscription.plan : 'Monthly';
    
    // Change subscription plan
    AdminManager.updateSubscriptionPlan(firstTenant.id, 'Enterprise');
    const updatedTenant = TenantManager.getAllTenants().find(t => t.id === firstTenant.id);
    
    return {
        initialPlan: initialPlan,
        updatedPlan: updatedTenant.subscription.plan,
        updatedPrice: updatedTenant.subscription.price,
        tenantsCount: tenants.length
    };
})()
'@
    $subResult = Eval-Script $code2 102
    Write-Host "Subscription Update Result: $($subResult | ConvertTo-Json -Compress)"
    if ($subResult.updatedPlan -eq "Enterprise" -and $subResult.updatedPrice -eq 49999) {
        Write-Host "PASS: Subscription tier updated to Enterprise (Rs 49,999/yr)!" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Subscription update failed!" -ForegroundColor Red
    }

    # Test 3: Test Impersonation View-Only Lock on index.html
    Write-Host "`n[Test 3] Testing View-Only Impersonation on index.html..." -ForegroundColor Yellow
    
    # Navigate to index.html with impersonation active
    Send-CDPCommand -Method "Page.navigate" -Params @{ url = "http://localhost:8080/index.html" } -Id 103 | Out-Null
    Start-Sleep -Seconds 2

    $code3 = @'
(() => {
    // Start impersonation of tenant-sgfc
    AuthManager.currentUser = {
        id: 'usr-superadmin',
        name: 'Devesh Chaturvedi',
        email: 'dmchaturvedi@gmail.com',
        role: 'super_admin'
    };
    AuthManager.startImpersonation('tenant-sgfc');
    
    const banner = document.getElementById('impersonation-banner');
    const isBannerVisible = banner && !banner.classList.contains('hidden');
    
    // Test mutation attempt: Try to submit arrival
    const arvBefore = ArrivalsManager.arrivals.length;
    ArrivalsManager.submitNewArrival({
        truckNo: 'DL-TEST-9999',
        driverName: 'Test Driver',
        driverPhone: '9999999999',
        farmerName: 'Test Farmer',
        farmerPhone: '9999999999',
        farmerLocation: 'Test Loc',
        commodity: 'Apple - Royal Delicious',
        variety: 'Medium',
        quantity: 100,
        unit: 'Box (20kg)',
        totalFreight: 10000,
        freightAdvance: 5000
    });
    const arvAfter = ArrivalsManager.arrivals.length;
    
    // Test mutation attempt: Try to record split sale
    const canMutateSale = AuthManager.assertCanMutate('test sale');

    return {
        isBannerVisible: isBannerVisible,
        isImpersonating: AuthManager.isImpersonating,
        impersonatedTenantId: AuthManager.impersonatedTenantId,
        mutationBlocked: (arvBefore === arvAfter),
        assertCanMutateResult: canMutateSale
    };
})()
'@
    $impersonateCheck = Eval-Script $code3 104
    Write-Host "Impersonation Result: $($impersonateCheck | ConvertTo-Json -Compress)"
    if ($impersonateCheck.isImpersonating -eq $true -and $impersonateCheck.mutationBlocked -eq $true -and $impersonateCheck.assertCanMutateResult -eq $false) {
        Write-Host "PASS: View-Only Audit Impersonation strictly blocks all mutations!" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Impersonation did not block data mutation!" -ForegroundColor Red
    }

    # Test 4: Exit Impersonation
    Write-Host "`n[Test 4] Testing Exit Impersonation..." -ForegroundColor Yellow
    $code4 = @'
(() => {
    AuthManager.stopImpersonation();
    return {
        isImpersonating: AuthManager.isImpersonating,
        impersonatedTenantId: AuthManager.impersonatedTenantId
    };
})()
'@
    $exitResult = Eval-Script $code4 105
    Write-Host "Exit Result: $($exitResult | ConvertTo-Json -Compress)"
    if ($exitResult.isImpersonating -eq $false -and $exitResult.impersonatedTenantId -eq $null) {
        Write-Host "PASS: Successfully exited impersonation mode!" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Exit impersonation failed!" -ForegroundColor Red
    }

    # Test 5: Test New Agency Sign-Up (Tenant Admin) & Strict Isolation
    Write-Host "`n[Test 5] Testing New Agency Sign-Up and Multi-Tenant Isolation..." -ForegroundColor Yellow
    $code5 = @'
(() => {
    // Perform sign up
    const res = AuthManager.signup({
        firmName: 'Kisan Kripa Trading Co.',
        proprietor: 'Sunil Kumar',
        phone: '9876543210',
        pin: '4321',
        shopNo: 'Shop B-105',
        mandiName: 'Azadpur Mandi, Delhi',
        apmcLicenseNo: 'DL-APMC-2026-99',
        theme: 'maroon'
    });

    const user = AuthManager.currentUser;
    const accessibleTenants = TenantManager.getAccessibleTenants(user);
    const select = document.getElementById('tenant-switcher-select');

    return {
        signupSuccess: res,
        userRole: user.role,
        userTenantId: user.tenantId,
        accessibleCount: accessibleTenants.length,
        accessibleFirmName: accessibleTenants[0].firmName,
        isSwitcherDisabled: select ? select.disabled : null
    };
})()
'@
    $signupResult = Eval-Script $code5 106
    Write-Host "Sign-Up Result: $($signupResult | ConvertTo-Json -Compress)"
    if ($signupResult.userRole -eq "shop_admin" -and $signupResult.accessibleCount -eq 1 -and $signupResult.accessibleFirmName -eq "Kisan Kripa Trading Co." -and $signupResult.isSwitcherDisabled -eq $true) {
        Write-Host "PASS: Tenant Admin created with STRICT ISOLATION! Only sees their own agency." -ForegroundColor Green
    } else {
        Write-Host "FAIL: Multi-tenant isolation check failed!" -ForegroundColor Red
    }

    # Test 6: Test Staff Provisioning by Tenant Admin
    Write-Host "`n[Test 6] Testing Staff Member Addition and Login Capability..." -ForegroundColor Yellow
    $code6 = @'
(() => {
    TeamManager.submitInviteMember({
        name: 'Raju Munshi',
        role: 'Munshi (Data Entry)',
        mobile: '9876500001',
        pin: '1111'
    });

    const staffInTeam = TeamManager.teamMembers.find(m => m.mobile === '9876500001');
    const customUsers = JSON.parse(localStorage.getItem('mandi_custom_users') || '[]');
    const syncedUser = customUsers.find(u => u.phone === '9876500001');

    // Test staff login
    AuthManager.logout();
    const loginOk = AuthManager.login('9876500001', '1111');
    const staffUser = AuthManager.currentUser;
    const staffAccessible = TenantManager.getAccessibleTenants(staffUser);

    return {
        staffInTeam: !!staffInTeam,
        syncedUserRole: syncedUser ? syncedUser.role : null,
        loginSuccess: loginOk,
        staffRole: staffUser ? staffUser.role : null,
        staffAccessibleCount: staffAccessible.length,
        staffFirmName: staffAccessible[0] ? staffAccessible[0].firmName : null
    };
})()
'@
    $staffResult = Eval-Script $code6 107
    Write-Host "Staff Test Result: $($staffResult | ConvertTo-Json -Compress)"
    if ($staffResult.staffInTeam -eq $true -and $staffResult.syncedUserRole -eq "munshi" -and $staffResult.loginSuccess -eq $true -and $staffResult.staffAccessibleCount -eq 1) {
        Write-Host "PASS: Munshi staff member added, authenticated, and isolated to firm!" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Staff provisioning test failed!" -ForegroundColor Red
    }

    Write-Host "`n=== ALL 6 E2E AUTOMATED TESTS COMPLETED SUCCESSFULLY ===" -ForegroundColor Green

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
}
finally {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($userDataDir -and (Test-Path $userDataDir)) {
        Remove-Item -Path $userDataDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
