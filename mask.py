import cv2
import numpy as np

# Read the image
image = cv2.imread('bake_texture/fingerring1.png')

# Convert BGR to HSV color space
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

# Define range for red color in HSV
# Red wraps around in HSV, so we need two ranges
lower_red1 = np.array([0, 50, 50])
upper_red1 = np.array([10, 255, 255])
lower_red2 = np.array([170, 50, 50])
upper_red2 = np.array([180, 255, 255])

# Create masks for both red ranges
mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
mask2 = cv2.inRange(hsv, lower_red2, upper_red2)

# Combine the masks
red_mask = cv2.bitwise_or(mask1, mask2)

# Invert the mask (red areas will be black, rest white)
final_mask = cv2.bitwise_not(red_mask)

# Save the result
cv2.imwrite('red_mask.jpg', final_mask)

# Optional: Display the result
cv2.imshow('Mask', final_mask)
cv2.waitKey(0)
cv2.destroyAllWindows()