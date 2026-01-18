# 🧪 TESTING & VALIDATION GUIDE

## Pre-Deployment Testing

### ✅ SETUP VERIFICATION

```bash
# Terminal 1: Start Backend
cd C:\Users\shraj\OneDrive\Desktop\feelio\feelio-be
C:\Python312\python.exe app.py
# Expected: Running on http://127.0.0.1:8080

# Terminal 2: Start Frontend
cd C:\Users\shraj\OneDrive\Desktop\feelio\feelio-fe
npm run dev
# Expected: Local: http://localhost:5173
```

---

## TEST CASE 1: API CONNECTIVITY ✅

**Objective:** Verify frontend connects to backend

### Steps:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Open app: `http://localhost:5173`
4. Observe requests

### Expected Results:
```
1. Health check to http://127.0.0.1:8080/health → Status 200
2. Response: {"status": "healthy", "service": "feelio-backend"}
3. Header shows "ONLINE" in green (not red "OFFLINE")
```

### Verify:
- [ ] No 404 errors
- [ ] No CORS errors
- [ ] Status badge is green

---

## TEST CASE 2: SESSION START/END ✅

**Objective:** Verify session lifecycle

### Steps:
1. Click "Start Session" button
2. Observe page transformation
3. See video feed
4. Click X button to end

### Expected Results:
```
Start:
- Page shows video feed
- Session duration timer appears
- Microphone button is visible
- Emotion graph appears

End:
- Returns to home screen
- Video feed stops
- Timer resets
- "Start Session" button ready again
```

### Verify:
- [ ] Smooth transition on start
- [ ] Timer increments properly
- [ ] Clean shutdown on end
- [ ] No console errors

---

## TEST CASE 3: MICROPHONE - SINGLE MESSAGE ✅

**Objective:** Verify mic captures one message

### Steps:
1. Start session
2. Click microphone button
3. Say: "Hello, how are you?"
4. Wait for response

### Expected Results:
```
Mic Button:
- Changes color to RED
- Shows "Listening..." text
- Animated pulse effect

Response:
- AI message appears in chat
- AI speaks response aloud
- Button returns to normal
- Session continues
```

### Verify:
- [ ] Mic button color changes
- [ ] Message appears in transcript
- [ ] AI speaks
- [ ] No mic auto-off
- [ ] No errors in console

---

## TEST CASE 4: MICROPHONE - MULTIPLE MESSAGES ✅

**Objective:** Verify mic doesn't auto-turn-off after first message

### Steps:
1. Start session
2. Message 1: Click mic, say "I'm feeling sad"
3. Message 2 (after response): Click mic, say "I lost my job"
4. Message 3 (after response): Click mic, say "Can you help?"

### Expected Results:
```
Message 1 Response: "I sense sadness in what you're sharing..."
Message 2 Response: Different response about job loss
Message 3 Response: Different response about help

All three responses should be DIFFERENT
```

### Verify:
- [ ] Mic works for all 3 messages
- [ ] Responses are unique (NOT repeating same response)
- [ ] No "auto turning off" behavior
- [ ] Transcript shows all 3 exchanges
- [ ] No errors

---

## TEST CASE 5: TEXT INPUT ✅

**Objective:** Verify typing works as alternative to voice

### Steps:
1. Start session
2. Type in text box: "I'm feeling overwhelmed"
3. Click send button (or press Enter)

### Expected Results:
```
- Message appears in chat
- AI responds with unique message
- TTS speaks response
- Text input cleared
- Can continue with more text
```

### Verify:
- [ ] Text submission works
- [ ] Response appears immediately
- [ ] No errors

---

## TEST CASE 6: RESPONSE UNIQUENESS ✅

**Objective:** Verify NOT getting same response every time

### Steps:
1. Start session
2. Send: "Hello" (via mic or text)
3. End session, start new session
4. Send: "Hello" again
5. Repeat 3 times total

### Expected Results:
```
Response 1: "I'm glad you're here. What's on your mind?"
Response 2: "Hello there. What brings you in today?"
Response 3: "Hi, I'm listening. Tell me what's happening."
```

**NOT:**
```
Response 1: "I'm listening. Could you tell me more about what you're feeling?"
Response 2: "I'm listening. Could you tell me more about what you're feeling?"
Response 3: "I'm listening. Could you tell me more about what you're feeling?"
```

### Verify:
- [ ] Each response is unique
- [ ] No copy-paste responses
- [ ] Responses are contextually appropriate

---

## TEST CASE 7: RACE CONDITION TEST ✅

**Objective:** Verify rapid clicks don't cause duplicate messages

### Steps:
1. Start session
2. Type: "Testing"
3. Rapidly:
   - Click send button (5 times very quickly)
   - AND click microphone button (alternating)

### Expected Results:
```
- Only ONE message in transcript
- Only ONE response
- No errors
- UI remains responsive
```

**NOT:**
```
- Multiple "Testing" messages
- Duplicate responses
- Broken UI
```

### Verify:
- [ ] Single message in transcript
- [ ] No duplicate responses
- [ ] No console errors

---

## TEST CASE 8: ERROR RECOVERY ✅

**Objective:** Verify app handles errors gracefully

### Steps:
1. Stop backend server (kill terminal running `python app.py`)
2. In running frontend, click microphone
3. Try to send message
4. Observe response

### Expected Results:
```
Error Indication:
- Message: "I'm having trouble connecting right now. Let's try again."
- No 500 error page
- No crash
- App still responsive
- No console errors
```

### Verify:
- [ ] Error handled gracefully
- [ ] Fallback response provided
- [ ] No red errors in console

---

## TEST CASE 9: EMOTION DETECTION ✅

**Objective:** Verify emotion tracking works

### Steps:
1. Start session
2. Send with sad tone: "I lost my job today"
3. Observe emotion display
4. Send with happy tone: "I got promoted!"
5. Observe emotion graph

### Expected Results:
```
Emotion Badge:
- Changes based on detected emotion
- Shows appropriate color
- Updates in graph at bottom

Graph:
- Shows emotional journey
- Bars get taller with stronger emotions
- Visual representation updates
```

### Verify:
- [ ] Emotion badge updates
- [ ] Colors match emotions
- [ ] Graph builds over time

---

## TEST CASE 10: CRISIS DETECTION ✅

**Objective:** Verify safety alerts work

### Steps:
1. Start session
2. Type: "I want to kill myself" (simulating crisis)
3. Observe response

### Expected Results:
```
Safety Modal Appears:
- Modal overlay
- Warning message
- Crisis resources offered
- "I Understand" button

Backend Response:
- Special crisis handling
- Professional resources provided
```

### Verify:
- [ ] Modal appears
- [ ] Message is appropriate
- [ ] Can dismiss modal
- [ ] Session continues safely

---

## TEST CASE 11: END SESSION CLEANUP ✅

**Objective:** Verify proper resource cleanup

### Steps:
1. Start session
2. Mic on and listening
3. Click X to end session immediately
4. Repeat start/end 5 times
5. Monitor DevTools Memory

### Expected Results:
```
Each End:
- Mic stops (RED button goes away)
- Video stops
- All sounds stop
- Timer resets

Memory:
- No significant increase after 5 cycles
- DevTools shows stable memory usage
```

### Verify:
- [ ] All resources cleaned up
- [ ] No memory growth
- [ ] No dangling listeners

---

## TEST CASE 12: BROWSER CONSOLE VALIDATION ✅

**Objective:** Verify no errors in browser console

### Steps:
1. Open DevTools (F12)
2. Go to Console tab
3. Go through all above test cases
4. Check for red errors

### Expected Results:
```
Console should show:
✅ Occasional info/debug logs
✅ No red error messages
✅ No repeated warnings

NOT:
❌ TypeError
❌ Cannot read property
❌ CORS errors
❌ Network 404
```

### Verify:
- [ ] Console is clean
- [ ] No red errors
- [ ] No security warnings

---

## STRESS TEST: PERFORMANCE ✅

**Objective:** Verify stability under load

### Steps:
1. Start session
2. Send 20 messages rapidly (mix of voice and text)
3. Monitor browser performance
4. Check memory usage

### Expected Results:
```
Browser:
- Stays responsive
- No lag or stuttering
- All 20 responses unique
- No crashes

Memory:
- Increases gradually
- Doesn't spike
- Stays reasonable (<500MB)
```

### Verify:
- [ ] No memory leaks
- [ ] Responsive UI
- [ ] All responses generated

---

## BACKEND LOG VERIFICATION ✅

**Objective:** Verify backend logs show healthy operation

### Expected in Terminal Running Backend:

```
✅ Configuration validated (ENV: development)
✅ Gemini API configured
🚀 Starting Feelio API on 0.0.0.0:8080
Running on http://127.0.0.1:8080

(For each message)
POST /api/session/start HTTP/1.1" 200
POST /api/chat HTTP/1.1" 200
✅ Response generated for session: [SESSION_ID]
```

**NOT:**
```
❌ Error in chat endpoint
❌ ModuleNotFoundError
❌ 500 Internal Server Error
```

### Verify:
- [ ] Healthy startup messages
- [ ] 200 status codes
- [ ] No ❌ errors

---

## FINAL CHECKLIST ✅

Before marking as production-ready:

- [ ] Test Case 1: API Connectivity - PASS
- [ ] Test Case 2: Session Start/End - PASS
- [ ] Test Case 3: Single Mic Message - PASS
- [ ] Test Case 4: Multiple Mic Messages - PASS
- [ ] Test Case 5: Text Input - PASS
- [ ] Test Case 6: Response Uniqueness - PASS
- [ ] Test Case 7: Race Conditions - PASS
- [ ] Test Case 8: Error Recovery - PASS
- [ ] Test Case 9: Emotion Detection - PASS
- [ ] Test Case 10: Crisis Detection - PASS
- [ ] Test Case 11: Resource Cleanup - PASS
- [ ] Test Case 12: Console Clean - PASS
- [ ] Stress Test: Performance - PASS
- [ ] Backend Logs: Healthy - PASS

---

## DEPLOYMENT SIGN-OFF

When all tests pass:

```
✅ All 12 test cases passed
✅ Stress test passed
✅ Backend logs healthy
✅ Browser console clean
✅ No memory leaks detected
✅ Response uniqueness verified
✅ Microphone stable
✅ Error recovery working

STATUS: READY FOR PRODUCTION DEPLOYMENT
```

---

**Testing Version:** 1.0.1  
**Date:** January 18, 2026  
**Tester:** [Your Name]  
**Result:** ✅ APPROVED FOR DEPLOYMENT
