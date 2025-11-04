#!/usr/bin/env python3

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch
import numpy as np

# Set up the figure
fig, ax = plt.subplots(1, 1, figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis('off')

# Define colors
primary_color = '#2563eb'
success_color = '#16a34a'
error_color = '#dc2626'
warning_color = '#ea580c'
light_blue = '#dbeafe'
light_green = '#dcfce7'
light_red = '#fef2f2'
light_orange = '#fff7ed'

# Title
ax.text(7, 9.5, 'Error Handling and Validation Flow', 
        fontsize=18, fontweight='bold', ha='center')

# Starting point
start_box = FancyBboxPatch((6, 8.5), 2, 0.6, 
                          boxstyle="round,pad=0.1", 
                          facecolor=light_blue, 
                          edgecolor=primary_color, linewidth=2)
ax.add_patch(start_box)
ax.text(7, 8.8, 'Request Received', fontsize=10, fontweight='bold', ha='center')

# Frontend Validation
frontend_box = FancyBboxPatch((1, 7.2), 3, 0.8, 
                             boxstyle="round,pad=0.1", 
                             facecolor=light_blue, 
                             edgecolor=primary_color, linewidth=2)
ax.add_patch(frontend_box)
ax.text(2.5, 7.8, 'Frontend Validation', fontsize=10, fontweight='bold', ha='center')
ax.text(2.5, 7.5, '• Input field validation', fontsize=8, ha='center')
ax.text(2.5, 7.3, '• Real-time feedback', fontsize=8, ha='center')

# Backend Validation
backend_box = FancyBboxPatch((10, 7.2), 3, 0.8, 
                            boxstyle="round,pad=0.1", 
                            facecolor=light_orange, 
                            edgecolor=warning_color, linewidth=2)
ax.add_patch(backend_box)
ax.text(11.5, 7.8, 'Backend Validation', fontsize=10, fontweight='bold', ha='center')
ax.text(11.5, 7.5, '• Data type checking', fontsize=8, ha='center')
ax.text(11.5, 7.3, '• Business rule validation', fontsize=8, ha='center')

# Validation Steps
steps = [
    ('Input Format Check', 2.5, 6.2),
    ('Data Type Validation', 5.5, 6.2),
    ('Content Requirements', 8.5, 6.2),
    ('Authorization Check', 11.5, 6.2)
]

for i, (step, x, y) in enumerate(steps):
    color = light_blue if i < 2 else light_orange
    edge_color = primary_color if i < 2 else warning_color
    
    step_box = FancyBboxPatch((x-1, y-0.3), 2, 0.6, 
                             boxstyle="round,pad=0.1", 
                             facecolor=color, 
                             edgecolor=edge_color, linewidth=2)
    ax.add_patch(step_box)
    ax.text(x, y, step, fontsize=9, fontweight='bold', ha='center')

# Decision diamonds
def draw_diamond(x, y, text, color=light_blue, edge_color=primary_color):
    diamond = patches.RegularPolygon((x, y), 4, radius=0.5, 
                                   orientation=np.pi/4,
                                   facecolor=color, 
                                   edgecolor=edge_color, linewidth=2)
    ax.add_patch(diamond)
    ax.text(x, y, text, fontsize=8, fontweight='bold', ha='center', va='center')

# Decision points
draw_diamond(2.5, 5.2, 'Valid?')
draw_diamond(5.5, 5.2, 'Valid?')
draw_diamond(8.5, 5.2, 'Valid?')
draw_diamond(11.5, 5.2, 'Valid?')

# Error handling boxes
error_boxes = [
    ('Client Error\n400 Bad Request', 1, 3.8, light_red, error_color),
    ('Validation Error\n422 Unprocessable', 4, 3.8, light_red, error_color),
    ('Content Error\n400 Bad Request', 7, 3.8, light_red, error_color),
    ('Auth Error\n401 Unauthorized', 10, 3.8, light_red, error_color)
]

for text, x, y, face_color, edge_color in error_boxes:
    error_box = FancyBboxPatch((x-0.8, y-0.4), 1.6, 0.8, 
                              boxstyle="round,pad=0.1", 
                              facecolor=face_color, 
                              edgecolor=edge_color, linewidth=2)
    ax.add_patch(error_box)
    ax.text(x, y, text, fontsize=8, fontweight='bold', ha='center', va='center')

# Success path
success_box = FancyBboxPatch((6, 3.5), 2, 0.6, 
                            boxstyle="round,pad=0.1", 
                            facecolor=light_green, 
                            edgecolor=success_color, linewidth=2)
ax.add_patch(success_box)
ax.text(7, 3.8, 'Process Request', fontsize=10, fontweight='bold', ha='center')

# Final response
response_box = FancyBboxPatch((6, 2.2), 2, 0.6, 
                             boxstyle="round,pad=0.1", 
                             facecolor=light_green, 
                             edgecolor=success_color, linewidth=2)
ax.add_patch(response_box)
ax.text(7, 2.5, '200 Success Response', fontsize=10, fontweight='bold', ha='center')

# Error logging
log_box = FancyBboxPatch((0.5, 1.5), 2.5, 0.6, 
                        boxstyle="round,pad=0.1", 
                        facecolor='#f3f4f6', 
                        edgecolor='#6b7280', linewidth=2)
ax.add_patch(log_box)
ax.text(1.75, 1.8, 'Error Logging & Monitoring', fontsize=9, fontweight='bold', ha='center')

# User feedback
feedback_box = FancyBboxPatch((11, 1.5), 2.5, 0.6, 
                             boxstyle="round,pad=0.1", 
                             facecolor='#f3f4f6', 
                             edgecolor='#6b7280', linewidth=2)
ax.add_patch(feedback_box)
ax.text(12.25, 1.8, 'User Feedback & Recovery', fontsize=9, fontweight='bold', ha='center')

# Draw arrows
def draw_arrow(start, end, color='black', style='->', linewidth=1.5):
    ax.annotate('', xy=end, xytext=start,
                arrowprops=dict(arrowstyle=style, color=color, linewidth=linewidth))

# Main flow arrows
draw_arrow((7, 8.5), (2.5, 7.8), primary_color)  # Start to Frontend
draw_arrow((7, 8.5), (11.5, 7.8), primary_color)  # Start to Backend

# Validation flow
draw_arrow((2.5, 7.2), (2.5, 6.5), primary_color)
draw_arrow((2.5, 5.9), (2.5, 5.7), primary_color)
draw_arrow((5.5, 6.5), (5.5, 5.7), primary_color)
draw_arrow((8.5, 6.5), (8.5, 5.7), primary_color)
draw_arrow((11.5, 6.5), (11.5, 5.7), primary_color)

# Error arrows
draw_arrow((2.2, 4.9), (1.3, 4.4), error_color)  # To error 1
draw_arrow((5.2, 4.9), (4.3, 4.4), error_color)  # To error 2
draw_arrow((8.2, 4.9), (7.3, 4.4), error_color)  # To error 3
draw_arrow((11.2, 4.9), (10.3, 4.4), error_color)  # To error 4

# Success arrows
draw_arrow((8.5, 4.8), (7.3, 4.1), success_color)  # To process
draw_arrow((11.5, 4.8), (7.3, 4.1), success_color)  # To process
draw_arrow((7, 3.5), (7, 2.8), success_color)  # To response

# Error logging arrows
for x in [1, 4, 7, 10]:
    draw_arrow((x, 3.4), (1.75, 2.1), '#6b7280', linewidth=1)

# User feedback arrows
for x in [1, 4, 7, 10]:
    draw_arrow((x, 3.4), (12.25, 2.1), '#6b7280', linewidth=1)

# Add "YES" and "NO" labels
ax.text(8.8, 4.6, 'YES', fontsize=8, color=success_color, fontweight='bold')
ax.text(11.8, 4.6, 'YES', fontsize=8, color=success_color, fontweight='bold')
ax.text(2.2, 4.6, 'NO', fontsize=8, color=error_color, fontweight='bold')
ax.text(5.2, 4.6, 'NO', fontsize=8, color=error_color, fontweight='bold')
ax.text(8.2, 4.6, 'NO', fontsize=8, color=error_color, fontweight='bold')
ax.text(11.2, 4.6, 'NO', fontsize=8, color=error_color, fontweight='bold')

# Add legend
legend_elements = [
    patches.Rectangle((0, 0), 1, 1, facecolor=light_blue, edgecolor=primary_color, label='Frontend Process'),
    patches.Rectangle((0, 0), 1, 1, facecolor=light_orange, edgecolor=warning_color, label='Backend Process'),
    patches.Rectangle((0, 0), 1, 1, facecolor=light_green, edgecolor=success_color, label='Success Path'),
    patches.Rectangle((0, 0), 1, 1, facecolor=light_red, edgecolor=error_color, label='Error Handling')
]

ax.legend(handles=legend_elements, loc='upper right', bbox_to_anchor=(0.98, 0.95))

# Add detailed annotations
ax.text(0.5, 0.8, 'Key Features:', fontsize=10, fontweight='bold')
ax.text(0.5, 0.5, '• Multi-layer validation (Frontend + Backend)', fontsize=8)
ax.text(0.5, 0.3, '• Comprehensive error categorization', fontsize=8)
ax.text(0.5, 0.1, '• Automatic logging and user feedback', fontsize=8)

ax.text(8.5, 0.8, 'Error Response Types:', fontsize=10, fontweight='bold')
ax.text(8.5, 0.5, '• 400: Bad Request (Client/Content errors)', fontsize=8)
ax.text(8.5, 0.3, '• 401: Unauthorized (Authentication)', fontsize=8)
ax.text(8.5, 0.1, '• 422: Unprocessable Entity (Validation)', fontsize=8)

plt.tight_layout()
plt.savefig('/Users/sanchitbishnoi/Desktop/Project-7/Report/images/error_handling_flow.png', 
           dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
plt.close()

print("Error Handling Flow diagram created successfully!")