    // Interactive demo functionality
    const students = [
      { id: "ST001", name: "Emma Thompson", status: "present", time: "09:28 AM" },
      { id: "ST002", name: "Liam Johnson", status: "present", time: "09:30 AM" },
      { id: "ST003", name: "Sophia Rodriguez", status: "late", time: "09:45 AM" },
      { id: "ST004", name: "Noah Williams", status: "present", time: "09:29 AM" }
    ];

    function updateStats() {
      const present = students.filter(s => s.status === 'present').length;
      const late = students.filter(s => s.status === 'late').length;
      const absent = students.filter(s => s.status === 'absent').length;
      const rate = Math.round((present / students.length) * 100);

      document.getElementById('present-count').textContent = present;
      document.getElementById('late-count').textContent = late;
      document.getElementById('absent-count').textContent = absent;
      document.getElementById('attendance-rate').textContent = rate + '%';
    }

    function getStatusBadge(status) {
      const badges = {
        present: '<span class="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">Present</span>',
        late: '<span class="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">Late</span>',
        absent: '<span class="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">Absent</span>'
      };
      return badges[status];
    }

    function setStatus(index, newStatus) {
      students[index].status = newStatus;
      if (newStatus === 'present') {
        students[index].time = '09:' + (25 + Math.floor(Math.random() * 10)) + ' AM';
      } else if (newStatus === 'late') {
        students[index].time = '09:' + (40 + Math.floor(Math.random() * 20)) + ' AM';
      } else {
        students[index].time = '-';
      }
      renderTable();
      updateStats();
    }

    function renderTable() {
      const tbody = document.getElementById('student-table');
      tbody.innerHTML = students.map((student, index) => `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="py-4 px-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                ${student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div class="font-medium text-gray-900">${student.name}</div>
            </div>
          </td>
          <td class="py-4 px-4 text-gray-500">${student.id}</td>
          <td class="py-4 px-4">${getStatusBadge(student.status)}</td>
          <td class="py-4 px-4 text-gray-500">${student.time}</td>
          <td class="py-4 px-4">
            <div class="flex space-x-2">
              <button onclick="setStatus(${index}, 'present')" 
                      class="px-3 py-1 rounded-lg text-sm font-medium transition-all ${student.status === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'}">
                Present
              </button>
              <button onclick="setStatus(${index}, 'late')" 
                      class="px-3 py-1 rounded-lg text-sm font-medium transition-all ${student.status === 'late' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700'}">
                Late
              </button>
              <button onclick="setStatus(${index}, 'absent')" 
                      class="px-3 py-1 rounded-lg text-sm font-medium transition-all ${student.status === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'}">
                Absent
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Initialize demo
    document.addEventListener('DOMContentLoaded', function() {
      renderTable();
      updateStats();
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
